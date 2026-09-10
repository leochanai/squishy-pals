import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { BufferGeometry, Float32BufferAttribute, CapsuleGeometry, Group, Mesh, MeshPhysicalNodeMaterial, SphereGeometry, TorusGeometry, Quaternion, Vector3, type PerspectiveCamera } from 'three/webgpu';
import { luminance, mix, output, vec3, vec4 } from 'three/tsl';
import type { MaterialPreset } from '../characters/types';

export type HandInteraction = { phase: 'hover' | 'grab' | 'hidden'; point?: Vector3 };

function smoothGlove(parts: Mesh[], material: MeshPhysicalNodeMaterial) {
  const resolution = 56, extent = 1.25;
  const center = new Vector3(.55, -.38, .08);
  const marching = new MarchingCubes(resolution, material, false, false, 20000);
  marching.isolation = 0;
  for (let z = 0; z < resolution; z++) for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    const px = (x / resolution * 2 - 1) * extent + center.x;
    const py = (y / resolution * 2 - 1) * extent + center.y;
    const pz = (z / resolution * 2 - 1) * extent + center.z;
    let distance = 10;
    for (const part of parts) {
      const dx = px - part.position.x, dy = py - part.position.y, dz = pz - part.position.z;
      const c = Math.cos(part.rotation.z), sn = Math.sin(part.rotation.z);
      const a = (c * dx + sn * dy) / part.scale.x, b = (-sn * dx + c * dy) / part.scale.y, d = dz / part.scale.z;
      const k = Math.hypot(a,b,d);
      const field = k * (k - 1) / Math.max(.00001,Math.hypot(a / part.scale.x,b / part.scale.y,d / part.scale.z));
      const h = Math.max(.1 - Math.abs(distance - field), 0) / .1;
      distance = Math.min(distance, field) - h * h * .025;
    }
    marching.field[x + y * resolution + z * resolution * resolution] = -distance;
  }
  marching.update();
  const count = marching.geometry.drawRange.count;
  const positions = marching.geometry.getAttribute('position'), normals = marching.geometry.getAttribute('normal');
  const p: number[] = [], n: number[] = [];
  for (let i=0;i<count;i++) {
    p.push(positions.getX(i)*extent+center.x,positions.getY(i)*extent+center.y,positions.getZ(i)*extent+center.z);
    n.push(normals.getX(i),normals.getY(i),normals.getZ(i));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(p,3));
  geometry.setAttribute('normal',new Float32BufferAttribute(n,3));
  geometry.computeBoundingSphere(); marching.geometry.dispose();
  return new Mesh(geometry, material);
}

/** A camera-facing, four-digit toy glove. Its fingertips mark the input target. */
export function createGrabHand() {
  const object = new Group();
  object.name = 'play-glove'; object.visible = false;
  const soft = new MeshPhysicalNodeMaterial({ color: '#fff5df', roughness: .48, clearcoat: .12 });
  const jelly = new MeshPhysicalNodeMaterial({ color: '#ffffff', roughness: .1, transmission: .8, thickness: .35, ior: 1.28, clearcoat: .35, attenuationColor: '#ffffff', attenuationDistance: 5, transparent: true, opacity: .52 });
  jelly.outputNode = vec4(mix(output.rgb, vec3(luminance(output.rgb)), .6), output.a);
  const shell = new MeshPhysicalNodeMaterial({ color: '#fff5df', metalness: .55, roughness: .38, clearcoat: .16 });
  const jointMaterial = new MeshPhysicalNodeMaterial({ color: '#4a545b', metalness: .5, roughness: .48 });
  const sphere = new SphereGeometry(1, 24, 16);
  const capsule = new CapsuleGeometry(1, 1, 8, 16);
  const seamGeometry = new TorusGeometry(1, .075, 8, 32);
  seamGeometry.rotateY(Math.PI / 2);
  const glove: Mesh[] = [];
  const joints = new Group(); object.add(joints); joints.visible = false;
  const add = (parent: Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = 0) => {
    const mesh = new Mesh(sphere, soft);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.rotation.z = rotation;
    parent.add(mesh); glove.push(mesh); return mesh;
  };
  add(object, .78, -.05, .01, .4, .42, .22, .12);
  const cuff = new Mesh(capsule, soft); cuff.position.set(1.15, -.08, .015); cuff.scale.set(.2, .2, .23); cuff.rotation.z = 0; object.add(cuff); glove.push(cuff);
  // A curved index opposes a shorter thumb; the other two fingers fold into the palm.
  for (let i = 0; i < 3; i++) {
    const digit = new Group(); object.add(digit);
    if (i === 0) {
      add(digit, .49, .27, .01, .32, .19, .18, .25);
      add(digit, .22, .25, .04, .25, .18, .18, -.45);
      add(digit, .06, .1, .055, .17, .21, .18, -.35);
    } else {
      add(digit, .72 + i * .1, -.16 - i * .12, -.08, .22, .19, .19, -.2);
    }

  }
  const thumb = new Group(); object.add(thumb);
  add(thumb, .49, -.31, .16, .33, .2, .2, .25);
  add(thumb, .2, -.31, .18, .23, .17, .19, .1);
  add(thumb, .06, -.22, .18, .17, .18, .18, -.5);
  const indexJoint = new Mesh(seamGeometry, jointMaterial);
  indexJoint.position.set(.34, .27, .025); indexJoint.scale.set(.18,.18,.18); indexJoint.rotation.z = -.3; joints.add(indexJoint);
  const wristJoint = new Mesh(seamGeometry, jointMaterial);
  wristJoint.position.set(1.08, -.08, .015); wristJoint.scale.set(.24,.31,.24); joints.add(wristJoint);
  const thumbJoint = new Mesh(seamGeometry,jointMaterial); thumbJoint.position.set(.3,-.31,.18); thumbJoint.scale.set(.18,.18,.18); thumbJoint.rotation.z=.1; thumb.add(thumbJoint);
  const smoothPalm = smoothGlove(glove.filter(mesh => mesh !== cuff && mesh.parent !== thumb), soft);
  const smoothThumb = smoothGlove(glove.filter(mesh => mesh.parent === thumb), soft);
  object.add(smoothPalm); thumb.add(smoothThumb); thumbJoint.visible = false;
  for (const mesh of glove) if (mesh !== cuff) mesh.visible = false;
  const target = new Vector3();
  const axis = new Vector3(0,0,1), rotation = new Quaternion();
  const projected = new Vector3();
  let angle = 0;
  let phase: HandInteraction['phase'] = 'hidden', amount = 0;
  return {
    object,
    setInteraction(state: HandInteraction) {
      phase = state.phase; object.visible = phase !== 'hidden';
      if (state.point) target.copy(state.point);
    },
    setMaterial(preset: MaterialPreset) {
      const material = preset === 'jelly' ? jelly : preset === 'mechanical' ? shell : soft;
      for (const mesh of glove) { mesh.material = material; mesh.visible = mesh === cuff; }
      smoothPalm.material = smoothThumb.material = material;
      smoothPalm.visible = smoothThumb.visible = true;
      smoothPalm.renderOrder = smoothThumb.renderOrder = cuff.renderOrder = preset === 'jelly' ? 2 : 0;
      joints.visible = thumbJoint.visible = preset === 'mechanical';
    },
    update(dt: number, camera: PerspectiveCamera, height: number) {
      if (!object.visible) return;
      amount += ((phase === 'grab' ? 1 : 0) - amount) * (1 - Math.exp(-24 * dt));
      thumb.position.y = -.1 + .19 * amount;
      smoothPalm.scale.y = joints.scale.y = 1 - .05 * amount;
      // Constant screen size across roles and viewports; preserve depth testing.
      const distance = camera.position.distanceTo(target);
      const scale = 2 * distance * Math.tan(camera.fov * Math.PI / 360) / Math.max(1,height) * 62;
      if (phase === 'hover') {
        projected.copy(target).project(camera);
        const nextAngle = Math.atan2(projected.y, projected.x * camera.aspect) + Math.PI / 4;
        angle += Math.atan2(Math.sin(nextAngle-angle),Math.cos(nextAngle-angle)) * (1-Math.exp(-18*dt));
      }
      object.scale.setScalar(scale);
      object.quaternion.copy(camera.quaternion).multiply(rotation.setFromAxisAngle(axis,angle));
      object.position.copy(target).addScaledVector(camera.getWorldDirection(new Vector3()), -scale * .22);
    },
    dispose() { object.removeFromParent(); sphere.dispose(); capsule.dispose(); seamGeometry.dispose(); smoothPalm.geometry.dispose(); smoothThumb.geometry.dispose(); for(const material of [soft,jelly,shell,jointMaterial]) material.dispose(); },
  };
}
