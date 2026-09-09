import * as THREE from 'three/webgpu';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createMechanicalShell } from './mechanical-shell.ts';
import { createMaterialVariants } from './materials.ts';
import type { Character, CharacterParameters, GrabHit, MovementConstraint } from './types';

const clamp = THREE.MathUtils.clamp;
type Species = 'seal' | 'turtle' | 'crab';
interface Part {
  mesh: THREE.Mesh;
  rest: Float32Array;
  handle: number;
  along: Float32Array;
}

export function createSealMochi(): Character { return createCoastalMochi('seal'); }
export function createTurtleMochi(): Character { return createCoastalMochi('turtle'); }
export function createCrabMochi(): Character { return createCoastalMochi('crab'); }

/** The three coastal pals share spring mechanics, with distinct bodies and gestures. */
function createCoastalMochi(species: Species): Character {
  const CENTER = new THREE.Vector3(0, species === 'seal' ? 1.06 : 0.85, 0);
  const RADII = species === 'seal' ? new THREE.Vector3(1.12, 1.02, 1.35) : species === 'turtle' ? new THREE.Vector3(1.14, 0.63, 1.27) : new THREE.Vector3(1.3, 0.65, 0.82);
  const object = new THREE.Group();
  object.name = species === 'seal' ? 'SealMochi' : species === 'turtle' ? 'TurtleMochi' : 'CrabMochi';
  const defaultHeading = 0;
  object.rotation.y = defaultHeading;
  let targetHeading = defaultHeading;
  const yawAxis = new THREE.Vector3(0, 1, 0);
  let movementConstraint: MovementConstraint | undefined;
  const parameters: CharacterParameters = { material: 'original', color: species === 'seal' ? '#b9d4df' : species === 'turtle' ? '#8fbe73' : '#dc4038', stiffness: 0.48, damping: 0.42 };
  const gel = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.52, clearcoat: 0.14, clearcoatRoughness: 0.5 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#110d08', roughness: 0.16, clearcoat: 0.7 });
  const parts: Part[] = [];
  const limbs: { tip: THREE.Vector3; root: THREE.Vector3; shift: THREE.Vector3; velocity: THREE.Vector3 }[] = [];
  const vector = new THREE.Vector3();
  function add(source: THREE.BufferGeometry, handle = -1) {
    source.deleteAttribute('normal'); source.deleteAttribute('uv');
    const geometry = mergeVertices(source, 0.00001); source.dispose();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, gel);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    object.add(mesh);
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    attribute.setUsage(THREE.DynamicDrawUsage);
    const along = new Float32Array(attribute.count);
    for (let i = 0; i < along.length; i++) along[i] = handle < 0 ? 0 : clamp(vector.fromBufferAttribute(attribute, i).distanceTo(limbs[handle].root) / limbs[handle].root.distanceTo(limbs[handle].tip), 0, 1);
    parts.push({ mesh, rest: new Float32Array(attribute.array), handle, along });
  }
  const pale = new THREE.MeshPhysicalNodeMaterial({ color: species === 'seal' ? '#f5eee4' : species === 'turtle' ? '#e5d4a0' : '#ffd7b0', roughness: 0.52, clearcoat: 0.14 });
  const shell = new THREE.MeshPhysicalNodeMaterial({ color: gel.color.clone().multiplyScalar(0.62), roughness: 0.56, clearcoat: 0.12 });
  const limbNames: string[] = [];
  function ellipsoid(name: string, center: number[], radius: number[], handle = -1, material = gel, angle = 0) {
    const geometry = new THREE.SphereGeometry(1, 36, 24);
    geometry.scale(radius[0], radius[1], radius[2]).rotateZ(angle).translate(center[0], center[1], center[2]);
    add(geometry, handle); const mesh = parts[parts.length - 1].mesh; mesh.material = material; mesh.name = name; return mesh;
  }
  function limb(name: string, root: number[], tip: number[]) {
    const handle = limbs.length;
    limbs.push({ root: new THREE.Vector3(...root), tip: new THREE.Vector3(...tip), shift: new THREE.Vector3(), velocity: new THREE.Vector3() });
    limbNames.push(name); return handle;
  }
  function tube(name: string, points: number[][], radius: number, material = dark, handle = -1) {
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 16, false), handle);
    const mesh = parts[parts.length - 1].mesh; mesh.name = name; mesh.material = material;
  }
  function paddle(name: string, root: number[], middle: number[], tip: number[], width: number, thickness: number) {
    const handle = limb(name, root, tip);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...root), new THREE.Vector3(...middle), new THREE.Vector3(...tip)]);
    const vertices: number[] = [], indices: number[] = [];
    const wide = new THREE.Vector3(), thin = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, point = curve.getPoint(t), tangent = curve.getTangent(t);
      wide.crossVectors(up, tangent).normalize(); thin.crossVectors(tangent, wide).normalize();
      const envelope = species === 'turtle'
        ? name === 'tail' ? (1 - t) ** .8 : Math.sin(Math.PI * (.3 + .7 * t)) ** .6
        : Math.sin(Math.PI * t) ** .6;
      for (let j = 0; j <= 20; j++) {
        const angle = j / 20 * Math.PI * 2;
        vector.copy(point).addScaledVector(wide, Math.cos(angle) * width * envelope).addScaledVector(thin, Math.sin(angle) * thickness * envelope);
        vertices.push(vector.x, vector.y, vector.z);
        if (i < 32 && j < 20) { const a = i * 21 + j, b = a + 21; indices.push(a, a + 1, b, b, a + 1, b + 1); }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
    add(geometry, handle); parts[parts.length - 1].mesh.name = name;
    return handle;
  }
  const coatMaterial = new THREE.MeshPhysicalNodeMaterial({ vertexColors: true, roughness: 0.52, clearcoat: 0.14 });
  let coatColors: THREE.BufferAttribute | undefined;
  const bellyWeights: number[] = [];
  function colorCoat() {
    if (!coatColors) return;
    const base = new THREE.Color(parameters.color), ivory = new THREE.Color('#e7edf0'), mixed = new THREE.Color();
    for (let i = 0; i < coatColors.count; i++) { mixed.copy(base).lerp(ivory, bellyWeights[i]); coatColors.setXYZ(i, mixed.r, mixed.g, mixed.b); }
    coatColors.needsUpdate = true;
  }
  if (species === 'seal') {
    // A prone, tapered trunk rises continuously into a smaller rounded head.
    // z, center height, vertical radius, horizontal radius, from hindquarters to nose.
    const stations = [[-2.2, .31, 0, 0], [-2.02, .32, .13, .17], [-1.65, .41, .28, .36], [-1.1, .56, .46, .58], [-.45, .73, .65, .77], [.2, .86, .77, .85], [.72, 1.04, .78, .74], [1.15, 1.23, .65, .58], [1.5, 1.26, .5, .46], [1.76, 1.2, .3, .29], [1.9, 1.17, 0, 0]];
    const vertices: number[] = [], indices: number[] = [];
    const section = (t: number) => {
      const scaled = t * (stations.length - 1), i = Math.min(stations.length - 2, Math.floor(scaled)), f = scaled - i;
      return stations[0].map((_, axis) => {
        const a = stations[Math.max(0, i - 1)][axis], b = stations[i][axis], c = stations[i + 1][axis], d = stations[Math.min(stations.length - 1, i + 2)][axis];
        const value = .5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
        return axis > 1 ? Math.max(0, value) : value;
      });
    };
    for (let i = 0; i <= 96; i++) {
      const [z, y, height, width] = section(i / 96);
      for (let j = 0; j <= 64; j++) {
        const angle = j / 64 * Math.PI * 2;
        vertices.push(width * Math.cos(angle), y + height * Math.sin(angle), z);
        if (i < 96 && j < 64) { const a = i * 65 + j, b = a + 65; indices.push(a, a + 1, b, b, a + 1, b + 1); }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
    add(geometry); const mesh = parts[0].mesh; mesh.name = 'body'; mesh.material = coatMaterial;
    const positions = mesh.geometry.getAttribute('position');
    coatColors = new THREE.Float32BufferAttribute(positions.count * 3, 3); mesh.geometry.setAttribute('color', coatColors);
    for (let i = 0; i < positions.count; i++) bellyWeights.push(1 - THREE.MathUtils.smoothstep(positions.getY(i), .52, .8));
    colorCoat();
  } else ellipsoid('body', CENTER.toArray(), RADII.toArray(), -1, species === 'turtle' ? shell : gel);
  const surfacePoint = (x: number, y: number) => {
    parts[0].mesh.updateMatrixWorld(true);
    return new THREE.Raycaster(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1)).intersectObject(parts[0].mesh, false)[0];
  };
  let headHandle = -1;
  if (species === 'seal') {
    for (const side of [-1, 1]) {
      paddle(`flipper-${side}`, [side * .57, .65, .65], [side * .97, .29, .18], [side * 1.08, .15, -.38], .21, .085);
      paddle(`tail-${side}`, [side * .055, .33, -2.0], [side * .17, .3, -2.42], [side * .2, .32, -2.78], .15, .055);
      ellipsoid(`muzzle-${side}`, [side * .12, 1.18, 1.85], [.2, .13, .11], -1, pale);
      for (let row = 0; row < 3; row++) tube(`whisker-${side}-${row}`, [[side * .19, 1.17, 1.95], [side * .36, 1.17 + (row - 1) * .05, 1.91], [side * .5, 1.17 + (row - 1) * .1, 1.75]], .011);
    }
    ellipsoid('nose', [0, 1.26, 1.94], [.085, .055, .04], -1, dark);
  } else if (species === 'turtle') {
    ellipsoid('soft-body', [0, .38, 0], [.94, .19, 1.16]);
    const plastron = new THREE.SphereGeometry(1, 36, 24);
    plastron.scale(1.18, .1, 1.31).translate(0, .43, 0);
    const plastronPositions = plastron.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < plastronPositions.count; i++) {
      const x = plastronPositions.getX(i), z = plastronPositions.getZ(i);
      // The rear midline opening exposes soft tissue instead of piercing the shell edge.
      if (z < -.7) plastronPositions.setZ(i, z + .38 * Math.exp(-((x / .32) ** 2)) * clamp((-z - .7) / .4, 0, 1));
    }
    add(plastron); parts[parts.length - 1].mesh.name = 'shell-rim'; parts[parts.length - 1].mesh.material = pale;
    headHandle = limb('head', [0, 0.7, 0.65], [0, 0.81, 1.57]);
    ellipsoid('head', [0, 0.83, 1.31], [0.57, 0.52, 0.63], headHandle);
    for (const side of [-1, 1]) {
      paddle(`flipper-${side}-1`, [side * .53, .46, .72], [side * 1.17, .4, .84], [side * 1.8, .16, .16], .3, .13);
      paddle(`flipper-${side}--1`, [side * .48, .43, -.63], [side * .91, .34, -1.03], [side * 1.23, .17, -1.42], .24, .11);
    }
    paddle('tail', [0, .36, -.88], [0, .25, -1.29], [0, .14, -1.72], .14, .095);
    // Rounded raised seams follow the dome instead of floating as flat decals.
    for (let edge = 0; edge < 6; edge++) {
      const a = edge * Math.PI / 3, b = (edge + 1) * Math.PI / 3;
      const dome = (x: number, z: number) => [x, CENTER.y + RADII.y * Math.sqrt(Math.max(0, 1 - (x / RADII.x) ** 2 - (z / RADII.z) ** 2)) + 0.009, z];
      const x = Math.cos(a) * 0.54, z = Math.sin(a) * 0.62;
      tube(`shell-hex-${edge}`, Array.from({ length: 9 }, (_, i) => dome(THREE.MathUtils.lerp(x, Math.cos(b) * 0.54, i / 8), THREE.MathUtils.lerp(z, Math.sin(b) * 0.62, i / 8))), 0.023, pale);
      tube(`shell-seam-${edge}`, Array.from({ length: 9 }, (_, i) => dome(x * (1 + i / 8 * 0.91), z * (1 + i / 8 * 0.91))), 0.023, pale);
    }
  } else {
    for (const side of [-1, 1]) {
      for (let leg = 0; leg < 4; leg++) {
        const z = .5 - leg * .32;
        const spread = .8 - leg * .55;
        const root = new THREE.Vector3(side * .85, .65, z);
        const knee = new THREE.Vector3(side * (1.55 + .08 * Math.sin(leg)), .43, spread);
        const tip = new THREE.Vector3(side * (1.83 + .08 * Math.sin(leg)), .08, spread * 1.3);
        const handle = limb(`leg-${side}-${leg}`, root.toArray(), tip.toArray());
        const curve = new THREE.CatmullRomCurve3([root, root.clone().lerp(knee, .65), knee, knee.clone().lerp(tip, .35), tip], false, 'centripetal');
        const geometry = new THREE.TubeGeometry(curve, 32, 1, 12, false);
        const positions = geometry.attributes.position as THREE.BufferAttribute;
        for (let ring = 0; ring <= 32; ring++) {
          const t = ring / 32, center = curve.getPointAt(t), radius = .13 * (1 - t) + .018 * t;
          for (let j = 0; j <= 12; j++) { const i = ring * 13 + j; vector.fromBufferAttribute(positions, i).sub(center).multiplyScalar(radius).add(center); positions.setXYZ(i, vector.x, vector.y, vector.z); }
        }
        add(geometry, handle); parts[parts.length - 1].mesh.name = `leg-${side}-${leg}`;
      }
      const handle = limb(`claw-${side}`, [side * 0.9, 0.88, 0.25], [side * 1.78, 1.62, 0.65]);
      tube(`arm-${side}`, [[side * 0.92, 0.88, 0.25], [side * 1.45, 0.96, 0.43], [side * 1.7, 1.4, 0.58]], 0.2, gel, handle);
      ellipsoid(`claw-palm-${side}`, [side * 1.77, 1.52, 0.64], [0.4, 0.36, 0.3], handle);
      for (const finger of [-1, 1]) ellipsoid(`claw-finger-${side}-${finger}`, [side * 1.77 + finger * 0.21, 1.79, 0.65], [0.16, 0.25, 0.24], handle, gel, finger * 0.48);
      ellipsoid(`eye-stalk-${side}`, [side * 0.45, 1.43, 0.32], [0.14, 0.33, 0.14]);
    }
  }
  const eyeCenter = species === 'seal' ? [0.32, 1.48, 1.6] : species === 'turtle' ? [0.38, 0.94, 1.77] : [0.45, 1.65, 0.43];
  for (const side of [-1, 1]) {
    const center = new THREE.Vector3(side * eyeCenter[0], eyeCenter[1], eyeCenter[2]);
    const sealSurface = species === 'seal' ? surfacePoint(center.x, center.y) : undefined;
    if (sealSurface) center.copy(sealSurface.point).addScaledVector(sealSurface.face!.normal, .012);
    const normal = sealSurface ? sealSurface.face!.normal.clone().normalize() : species === 'turtle' ? new THREE.Vector3(center.x / 0.57 ** 2, (center.y - 0.83) / 0.52 ** 2, (center.z - 1.31) / 0.63 ** 2).normalize() : species === 'seal' ? new THREE.Vector3(center.x / RADII.x ** 2, (center.y - CENTER.y) / RADII.y ** 2, center.z / RADII.z ** 2).normalize() : new THREE.Vector3(0, 0, 1);
    const eye = new THREE.SphereGeometry(1, 24, 16).scale(0.105, 0.13, 0.065);
    eye.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)).translate(center.x, center.y, center.z);
    add(eye, headHandle); parts[parts.length - 1].mesh.material = dark; parts[parts.length - 1].mesh.name = side < 0 ? 'left-eye' : 'right-eye';
  }
  const smileY = species === 'seal' ? 1.03 : species === 'turtle' ? 0.69 : 0.96;
  const smileZ = species === 'seal' ? 1.87 : species === 'turtle' ? 1.92 : 0.815;
  tube('smile', [[-0.16, smileY + 0.035, smileZ], [0, smileY - 0.035, smileZ + 0.008], [0.16, smileY + 0.035, smileZ]], 0.023, dark, headHandle);
  // Accessory fitting reads eye centers, while all visible geometry deforms in rest space.
  for (const name of ['left-eye', 'right-eye']) {
    const mesh = object.getObjectByName(name)!;
    mesh.name = `${name}-surface`;
    const marker = new THREE.Object3D(); marker.name = name;
    marker.position.set(name === 'left-eye' ? -eyeCenter[0] : eyeCenter[0], eyeCenter[1], eyeCenter[2]); if (species === 'seal') { const hit = surfacePoint(marker.position.x, marker.position.y); if (hit) marker.position.copy(hit.point).addScaledVector(hit.face!.normal, .012); } object.add(marker);
  }
  const body = new THREE.Vector3(), velocity = new THREE.Vector3(), delta = new THREE.Vector3();
  const pressPoint = new THREE.Vector3(), pressNormal = new THREE.Vector3();
  const stretch = new THREE.Vector3(), stretchVelocity = new THREE.Vector3();
  const wobble = new THREE.Vector3(), wobbleVelocity = new THREE.Vector3();
  const previousVelocity = new THREE.Vector3(), force = new THREE.Vector3(), softTarget = new THREE.Vector3();
  let squash = 0, squashVelocity = 0, press = 0, pressVelocity = 0, pressTarget = 0, clock = -1, frame = 0, lastTime = 0;
  let grab: { handle: number; target: THREE.Vector3; worldTarget: THREE.Vector3; offset: THREE.Vector3; drag: boolean; head: boolean; turnX: number; heading: number } | null = null;
  function deform(x: number, y: number, z: number, out: THREE.Vector3, time: number, handle = -1, along = 0) {
    out.set(x * (1 + squash * 0.35), 0.18 + (y - 0.18) * (1 - squash), z * (1 + squash * 0.22)).add(body);
    // Every surface uses this same material-space field, including the face and
    // overlapping fin/arm roots. A pull travels through the body rather than
    // translating a rigid mantle while its appendages move independently.
    const reach = (x - pressPoint.x) ** 2 + (y - pressPoint.y) ** 2 + (z - pressPoint.z) ** 2;
    out.addScaledVector(stretch, Math.exp(-reach / 1.65));
    out.addScaledVector(wobble, clamp((y - 0.18) / 1.65, 0, 1) * (0.75 + 0.25 * Math.cos(z - CENTER.z)));
    if (handle >= 0) { out.addScaledVector(limbs[handle].shift, along * along); out.y += Math.sin(time * 1.7 + handle * 0.8) * 0.025 * along * along; }
    const distance = (x - pressPoint.x) ** 2 + (y - pressPoint.y) ** 2 + (z - pressPoint.z) ** 2;
    out.addScaledVector(pressNormal, -press * Math.exp(-distance / 0.32));
    const gesture = clock < 0 ? 0 : Math.sin(Math.PI * clamp(clock / 1.2, 0, 1)) ** 2;
    const name = handle < 0 ? '' : limbNames[handle];
    if (species === 'seal' && name.startsWith('flipper')) out.y += Math.sin(time * 7) * (0.025 + gesture * 0.25) * along;
    if (species === 'turtle' && handle === headHandle) out.z -= gesture * 0.85 * along;
    if (species === 'crab' && name.startsWith('claw')) { out.y += gesture * 0.55 * along; out.x += Math.sin(time * 8) * gesture * 0.09 * along; }
    out.y = Math.max(0.03, out.y);
  }
  function render(time: number) {
    for (const part of parts) {
      const attribute = part.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < attribute.count; i++) { const n = i * 3; deform(part.rest[n], part.rest[n + 1], part.rest[n + 2], vector, time, part.handle, part.along[i]); attribute.setXYZ(i, vector.x, vector.y, vector.z); }
      attribute.needsUpdate = true; part.mesh.geometry.computeVertexNormals();
      part.mesh.geometry.boundingSphere!.center.copy(body).add(CENTER); part.mesh.geometry.boundingSphere!.radius = 5;
    }
  }

  function moveGrab(worldPoint: THREE.Vector3, isDrag: boolean) { if (!grab) return;
    // Map the complete gesture to yaw, so returning the pointer restores its heading.
    if (grab.head && isDrag) {
      const distance = worldPoint.x - grab.turnX;
      const turn = Math.sign(distance) * Math.max(0, Math.abs(distance) - 0.12) * 1.4;
      targetHeading = clamp(grab.heading + turn, defaultHeading - Math.PI / 2, defaultHeading + Math.PI / 2);
    }
    grab.worldTarget.copy(worldPoint);
    grab.target.copy(worldPoint); object.worldToLocal(grab.target); if (!movementConstraint) { grab.target.x = clamp(grab.target.x, -4.5, 4.5); grab.target.z = clamp(grab.target.z, -4.5, 4.5); grab.target.y = clamp(grab.target.y, 0.08, 5.5); } grab.target.y = Math.max(0.08, grab.target.y); grab.drag = isDrag; if (isDrag) pressTarget = 0; }
  function simulate(dt: number) {
    if (grab?.head && grab.drag) {
      const difference = Math.atan2(Math.sin(targetHeading - object.rotation.y), Math.cos(targetHeading - object.rotation.y));
      const turn = difference * (1 - Math.exp(-dt * 8));
      // Rotate around the held material point, preserving its world position and
      // world velocity while the body moves into the new heading underneath it.
      body.add(grab.offset).applyAxisAngle(yawAxis, -turn).sub(grab.offset);
      velocity.applyAxisAngle(yawAxis, -turn);
      object.rotation.y += turn;
      object.updateMatrixWorld(true);
      moveGrab(grab.worldTarget, true);
    }
    // Stiffness controls compliance; damping is a ratio of critical damping.
    const compliance = 1.6 - parameters.stiffness * 1.35;
    const dampingRatio = 0.24 + parameters.damping * 0.76;
    const bodySpring = 32 + parameters.stiffness * 64;
    const shapeSpring = 50 + parameters.stiffness * 100;
    const shapeDamping = 2 * Math.sqrt(shapeSpring) * dampingRatio;
    const limbLimit = 0.95 - parameters.stiffness * 0.7;
    previousVelocity.copy(velocity);
    if (grab?.drag && grab.handle < 0) {
      delta.copy(grab.target).sub(grab.offset).sub(body); velocity.addScaledVector(delta, dt * bodySpring); velocity.y -= 11 * dt; velocity.multiplyScalar(Math.exp(-dt * 2 * Math.sqrt(bodySpring) * (0.72 + parameters.damping * 0.28)));
    } else {
      velocity.y -= 13 * dt; velocity.x -= body.x * dt * 6; velocity.z -= body.z * dt * 6;
      velocity.x *= Math.exp(-dt * 2 * Math.sqrt(6) * dampingRatio); velocity.z *= Math.exp(-dt * 2 * Math.sqrt(6) * dampingRatio);
    }
    body.addScaledVector(velocity, dt);
    if (body.y < 0) { const impact = Math.max(0, -velocity.y); body.y = 0; velocity.y = impact > 0.6 ? impact * (0.42 - parameters.damping * 0.36) : 0; squashVelocity += impact > 0.6 ? impact * 0.8 * compliance : 0; }
    if (movementConstraint) movementConstraint(body, velocity);
    else {
      for (const axis of ['x', 'z'] as const) if (Math.abs(body[axis]) > 2.6) { body[axis] = clamp(body[axis], -2.6, 2.6); velocity[axis] *= 0.1; }
      if (body.y > 3.5) { body.y = 3.5; velocity.y = Math.min(0, velocity.y); }
    }
    const targetSquash = species === 'seal' && clock >= 0 && clock < 0.15 ? 0.27 * compliance : 0;
    const squashSpring = 80 + parameters.stiffness * 160;
    squashVelocity += ((targetSquash - squash) * squashSpring - squashVelocity * 2 * Math.sqrt(squashSpring) * dampingRatio) * dt;
    squash = clamp(squash + squashVelocity * dt, -0.18, 0.42);
    const pressSpring = 120 + parameters.stiffness * 120;
    pressVelocity += ((pressTarget * compliance - press) * pressSpring - pressVelocity * 2 * Math.sqrt(pressSpring) * (grab ? Math.max(0.85, dampingRatio) : dampingRatio)) * dt;
    press += pressVelocity * dt;
    for (let i = 0; i < limbs.length; i++) {
      const limb = limbs[i]; delta.copy(limb.shift).negate();
      if (grab?.drag && grab.handle === i) { delta.copy(grab.target).sub(grab.offset).sub(body).sub(limb.tip).clampLength(0, limbLimit).sub(limb.shift); velocity.addScaledVector(delta, dt * 8); }
      limb.velocity.addScaledVector(delta, dt * shapeSpring); limb.velocity.multiplyScalar(Math.exp(-dt * shapeDamping)); limb.shift.addScaledVector(limb.velocity, dt).clampLength(0, limbLimit);
    }
    if (clock >= 0) { const previous = clock; clock += dt; if (species === 'seal' && previous < 0.15 && clock >= 0.15) velocity.y = 3.5; if (clock > 1.3) clock = -1; }
    softTarget.set(0, 0, 0);
    if (grab?.drag) {
      softTarget.copy(grab.target).sub(grab.offset).sub(body);
      if (grab.handle >= 0) softTarget.sub(limbs[grab.handle].tip).multiplyScalar(0.55);
      softTarget.multiplyScalar(compliance * 1.6).clampLength(0, 1.05 - parameters.stiffness * 0.75);
    }
    const spring = shapeSpring, drag = shapeDamping;
    force.copy(softTarget).sub(stretch).multiplyScalar(spring).addScaledVector(stretchVelocity, -drag);
    stretchVelocity.addScaledVector(force, dt); stretch.addScaledVector(stretchVelocity, dt).clampLength(0, 1.15 - parameters.stiffness * 0.8);
    // Acceleration excites a separate, slower mantle mode. It survives release,
    // so throw/landing energy visibly travels through the animal before settling.
    softTarget.copy(previousVelocity).sub(velocity).multiplyScalar(0.014 * compliance / Math.max(dt, 0.0001)).clampLength(0, 0.45);
    const wobbleSpring = 24 + parameters.stiffness * 30;
    force.copy(softTarget).sub(wobble).multiplyScalar(wobbleSpring).addScaledVector(wobbleVelocity, -2 * Math.sqrt(wobbleSpring) * dampingRatio);
    wobbleVelocity.addScaledVector(force, dt); wobble.addScaledVector(wobbleVelocity, dt).clampLength(0, 0.5);
  }
  function reset() { object.rotation.y = targetHeading = defaultHeading; object.updateMatrixWorld(true); stretch.set(0, 0, 0); stretchVelocity.set(0, 0, 0); wobble.set(0, 0, 0); wobbleVelocity.set(0, 0, 0); body.set(0, 0, 0); velocity.set(0, 0, 0); squash = squashVelocity = press = pressVelocity = pressTarget = 0; clock = -1; grab = null; for (const limb of limbs) { limb.shift.set(0, 0, 0); limb.velocity.set(0, 0, 0); } render(lastTime); mechanicalShell.update(); }
  const materialVariants = createMaterialVariants(object, [{ material: gel, thickness: 1 }, { material: pale, thickness: 0.2 }, { material: shell, thickness: 0.6 }, { material: coatMaterial, thickness: 1 }], [dark]);
  const mechanicalShell = createMechanicalShell(parts.filter(surface => surface.mesh.material !== dark && !surface.mesh.name.startsWith('shell-seam') && !surface.mesh.name.startsWith('shell-hex')).map((surface, i) => ({ mesh: surface.mesh, axis: 'z' as const, bands: i === 0 ? 4 : 5, sectors: i === 0 ? 6 : 1, progress: surface.handle >= 0 ? surface.along : undefined })));
  reset();
  return {
    object,
    deformAccessory(point, out) { deform(point.x, point.y, point.z, out, lastTime, species === 'turtle' ? headHandle : -1, species === 'turtle' ? clamp((point.z - 0.65) / 0.92, 0, 1) : 0); },
    setMovementConstraint(constraint) { movementConstraint = constraint; constraint(body, velocity); },
    pick(raycaster) { const hit = mechanicalShell.pick(raycaster) ?? raycaster.intersectObjects(parts.map(part => part.mesh), false)[0]; if (!hit) return null; const part = parts.find(part => part.mesh === hit.object)!; return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: part.handle < 0 ? 'body' : limbNames[part.handle], handle: part.handle }; },
    beginGrab(hit: GrabHit) { const local = object.worldToLocal(hit.point.clone()); const anchor = body.clone(); if (hit.handle >= 0) anchor.add(limbs[hit.handle].tip).add(limbs[hit.handle].shift); pressPoint.copy(local).sub(body); grab = { handle: hit.handle, target: local.clone(), worldTarget: hit.point.clone(), offset: local.clone().sub(anchor), drag: false, head: species === 'turtle' ? hit.handle === headHandle : hit.handle < 0 && pressPoint.z > 0.4, turnX: hit.point.x, heading: object.rotation.y }; pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab,
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05), steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps); render(time); mechanicalShell.update(); frame++; },
    poke() { grab = null; pressTarget = 0; clock = 0; }, reset,
    setParameters(next) {
      if (next.view !== undefined) { parameters.view = next.view; object.rotation.y = targetHeading = next.view === 'front' ? defaultHeading : Math.PI / 2; object.updateMatrixWorld(true); }
      if (next.color) { parameters.color = next.color; gel.color.set(next.color); colorCoat(); shell.color.set(next.color).multiplyScalar(0.62); }
      if (next.material !== undefined) parameters.material = next.material;
      if (next.color || next.material !== undefined) { materialVariants.set(parameters.material); mechanicalShell.set(parameters.material); }
      if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1);
      if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1);
    },
    diagnostics() { return { species, limbCount: limbs.length, eyeCount: 2, gestureProgress: clock, vertices: parts.reduce((sum, part) => sum + part.rest.length / 3, 0), bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab ? grab.handle < 0 ? 'body' : limbNames[grab.handle] : 'none', deformationAmplitude: stretch.length() + wobble.length(), localStretch: stretch.length(), inertialWobble: wobble.length(), maxLimbDisplacement: Math.max(...limbs.map(limb => limb.shift.length())), finite: Number.isFinite(body.lengthSq() + stretch.lengthSq() + wobble.lengthSq() + squash + limbs.reduce((sum, limb) => sum + limb.shift.lengthSq(), 0)), frames: frame }; },
    dispose() { mechanicalShell.dispose(); const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(materialVariants.materials); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } }); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); object.clear(); },
  };
}
