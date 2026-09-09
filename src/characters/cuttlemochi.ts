import * as THREE from 'three/webgpu';
import { createMechanicalShell } from './mechanical-shell.ts';
import { createMaterialVariants } from './materials.ts';
import type { Character, CharacterParameters, GrabHit, MovementConstraint } from './types';

const clamp = THREE.MathUtils.clamp;
const CENTER = new THREE.Vector3(0, 1.03, -0.42);
const RADII = new THREE.Vector3(1.08, 0.83, 1.62);
interface Part {
  mesh: THREE.Mesh;
  rest: Float32Array;
  handle: number;
  fin: boolean;
  along: Float32Array;
}

/** A lentil-shaped mantle and a paired swimming skirt distinguish the cuttlefish. */
export function createCuttleMochi(): Character {
  const object = new THREE.Group();
  object.name = 'CuttleMochi';
  let targetHeading = 0;
  const yawAxis = new THREE.Vector3(0, 1, 0);
  let movementConstraint: MovementConstraint | undefined;
  const parameters: CharacterParameters = { material: 'original', color: '#9cccbc', stiffness: 0.48, damping: 0.42 };
  const gel = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.4, transmission: 0.08, thickness: 1.1, ior: 1.38, attenuationColor: new THREE.Color('#bce1d5'), attenuationDistance: 2.2 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#203c39', roughness: 0.2, clearcoat: 0.8 });
  const blush = new THREE.MeshStandardNodeMaterial({ color: '#e6a8b5', roughness: 0.75 });
  const parts: Part[] = [];
  const limbs: { tip: THREE.Vector3; shift: THREE.Vector3; velocity: THREE.Vector3 }[] = [];
  const vector = new THREE.Vector3();
  function add(geometry: THREE.BufferGeometry, handle = -1, fin = false) {
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, gel);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    object.add(mesh);
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    attribute.setUsage(THREE.DynamicDrawUsage);
    const along = new Float32Array(attribute.count);
    for (let i = 0; i < along.length; i++) along[i] = handle < 0 ? 0 : clamp((attribute.getZ(i) - 0.68) / (limbs[handle].tip.z - 0.68), 0, 1);
    parts.push({ mesh, rest: new Float32Array(attribute.array), handle, fin, along });
  }
  const mantle = new THREE.SphereGeometry(1, 64, 40);
  mantle.scale(RADII.x, RADII.y, RADII.z).translate(CENTER.x, CENTER.y, CENTER.z);
  add(mantle);

  // Closed, rounded ribbons overlap the mantle at their inner edges. The wave
  // travels along their length without opening a seam or changing the body.
  for (const side of [-1, 1]) {
    const vertices: number[] = [], indices: number[] = [];
    const rows = 64, columns = 12;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, angle = -Math.PI / 2 + t * Math.PI;
      const envelope = Math.sin(Math.PI * t);
      for (let j = 0; j <= columns; j++) {
        const phase = j / columns * Math.PI * 2;
        const width = 0.015 + 0.25 * envelope;
        const radial = width * (1 + Math.cos(phase));
        vertices.push(side * (0.96 * Math.cos(angle) + radial), 0.83 + Math.sin(phase) * (0.016 + 0.065 * envelope), CENTER.z + 1.59 * Math.sin(angle));
        if (i < rows && j < columns) {
          const a = i * (columns + 1) + j, b = a + columns + 1;
          if (side > 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
          else indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
    add(geometry, -1, true);
  }
  for (let arm = 0; arm < 10; arm++) {
    const long = arm >= 8;
    const side = arm === 8 ? -1 : 1;
    const lane = long ? side * 0.88 : (arm - 3.5) / 3.5;
    const tip = new THREE.Vector3(long ? side * 1.42 : lane * 1.18, long ? 0.37 : 0.35, long ? 2.56 : 1.85 + 0.25 * (1 - Math.abs(lane)));
    const root = new THREE.Vector3(lane * 0.64, 0.61, 0.68);
    const curve = new THREE.CatmullRomCurve3([root, new THREE.Vector3(lane * 0.9, 0.43, 1.2), new THREE.Vector3(tip.x * 0.95, 0.28, tip.z - 0.25), tip]);
    const frames = curve.computeFrenetFrames(28, false);
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28, p = curve.getPointAt(t);
      const radius = long ? (0.11 * (1 - t) + 0.075 + 0.085 * Math.exp(-(((t - 0.87) / 0.11) ** 2))) * Math.sqrt(1 - t) : 0.235 * Math.pow(1 - t, 0.55);
      for (let j = 0; j <= 12; j++) {
        const angle = j / 12 * Math.PI * 2;
        vector.copy(p).addScaledVector(frames.normals[i], Math.cos(angle) * radius).addScaledVector(frames.binormals[i], Math.sin(angle) * radius);
        vertices.push(vector.x, vector.y, vector.z);
        if (i < 28 && j < 12) {
          // Share the circumference seam and the terminal pole so their
          // normals stay continuous when the deformed surface is rebuilt.
          const a = i * 13 + j, c = i * 13 + (j + 1) % 12;
          const b = (i + 1) * 13 + (i === 27 ? 0 : j);
          const d = (i + 1) * 13 + (i === 27 ? 0 : (j + 1) % 12);
          indices.push(a, c, b);
          if (b !== d) indices.push(b, c, d);
        }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
    limbs.push({ tip, shift: new THREE.Vector3(), velocity: new THREE.Vector3() });
    add(geometry, arm);
  }
  const face: { mesh: THREE.Mesh; rest: THREE.Vector3; eye: boolean }[] = [];
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  function facePoint(x: number, y: number) { return new THREE.Vector3(x, y, CENTER.z + RADII.z * Math.sqrt(Math.max(0, 1 - (x / RADII.x) ** 2 - ((y - CENTER.y) / RADII.y) ** 2)) + 0.035); }
  function detail(mesh: THREE.Mesh, rest: THREE.Vector3, eye = false) { object.add(mesh); face.push({ mesh, rest, eye }); }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, dark); eye.scale.set(0.12, 0.155, 0.07); detail(eye, facePoint(side * 0.4, 1.14), true);
    const cheek = new THREE.Mesh(sphere, blush); cheek.scale.set(0.15, 0.058, 0.025); detail(cheek, facePoint(side * 0.59, 0.96));
  }
  const smile = new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => new THREE.Vector3(Math.cos(Math.PI + i / 16 * Math.PI) * 0.125, Math.sin(Math.PI + i / 16 * Math.PI) * 0.07, 0)));
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(smile, 20, 0.02, 8, false), dark); detail(mouth, facePoint(0, 1.01));
  const surprised = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.019, 8, 20), dark); object.add(surprised); surprised.visible = false;
  const body = new THREE.Vector3(), velocity = new THREE.Vector3(), delta = new THREE.Vector3();
  const pressPoint = new THREE.Vector3(), pressNormal = new THREE.Vector3();
  const stretch = new THREE.Vector3(), stretchVelocity = new THREE.Vector3();
  const wobble = new THREE.Vector3(), wobbleVelocity = new THREE.Vector3();
  const previousVelocity = new THREE.Vector3(), force = new THREE.Vector3(), softTarget = new THREE.Vector3();
  const tangentX = new THREE.Vector3(), tangentY = new THREE.Vector3(), faceNormal = new THREE.Vector3();
  const front = new THREE.Vector3(0, 0, 1);
  let squash = 0, squashVelocity = 0, press = 0, pressVelocity = 0, pressTarget = 0, clock = -1, frame = 0, lastTime = 0;
  let grab: { handle: number; target: THREE.Vector3; worldTarget: THREE.Vector3; offset: THREE.Vector3; drag: boolean; head: boolean; turnX: number; heading: number } | null = null;
  function deform(x: number, y: number, z: number, out: THREE.Vector3, time: number, fin = false, handle = -1, along = 0) {
    out.set(x * (1 + squash * 0.35), 0.18 + (y - 0.18) * (1 - squash), z * (1 + squash * 0.22)).add(body);
    // Every surface uses this same material-space field, including the face and
    // overlapping fin/arm roots. A pull travels through the body rather than
    // translating a rigid mantle while its appendages move independently.
    const reach = (x - pressPoint.x) ** 2 + (y - pressPoint.y) ** 2 + (z - pressPoint.z) ** 2;
    out.addScaledVector(stretch, Math.exp(-reach / 1.65));
    out.addScaledVector(wobble, clamp((y - 0.18) / 1.65, 0, 1) * (0.75 + 0.25 * Math.cos(z - CENTER.z)));
    if (fin) out.y += 0.07 * Math.sin(time * 2.8 - z * 3.2) * clamp((Math.abs(x) - 0.83) / 0.5, 0, 1);
    if (handle >= 0) { out.addScaledVector(limbs[handle].shift, along * along); out.y += Math.sin(time * 1.7 + handle * 0.8) * 0.025 * along * along; }
    const distance = (x - pressPoint.x) ** 2 + (y - pressPoint.y) ** 2 + (z - pressPoint.z) ** 2;
    out.addScaledVector(pressNormal, -press * Math.exp(-distance / 0.32));
    out.y = Math.max(0.03, out.y);
  }
  function render(time: number) {
    for (const part of parts) {
      const attribute = part.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < attribute.count; i++) { const n = i * 3; deform(part.rest[n], part.rest[n + 1], part.rest[n + 2], vector, time, part.fin, part.handle, part.along[i]); attribute.setXYZ(i, vector.x, vector.y, vector.z); }
      attribute.needsUpdate = true; part.mesh.geometry.computeVertexNormals();
      // Shell construction caches rest bounds; picking must follow deformation.
      part.mesh.geometry.boundingBox = null;
      part.mesh.geometry.boundingSphere!.center.copy(body).add(CENTER); part.mesh.geometry.boundingSphere!.radius = 5;
    }
    const blink = time % 5.9 > 5.5 && time % 5.9 < 5.68 ? Math.max(0.08, Math.abs(time % 5.9 - 5.59) / 0.09) : 1;
    for (const item of face) {
      const { x, y, z } = item.rest;
      deform(x, y, z, item.mesh.position, time);
      deform(x + 0.02, y, z, tangentX, time); tangentX.sub(item.mesh.position);
      deform(x, y + 0.02, z, tangentY, time); tangentY.sub(item.mesh.position);
      faceNormal.crossVectors(tangentX, tangentY).normalize();
      item.mesh.quaternion.setFromUnitVectors(front, faceNormal);
      if (item.eye) item.mesh.scale.y = 0.155 * blink * (1 - squash);
    }
    surprised.position.copy(mouth.position); surprised.quaternion.copy(mouth.quaternion); surprised.visible = Boolean(grab?.drag) || clock > 0.13 && clock < 0.5; mouth.visible = !surprised.visible;
  }
  function moveGrab(worldPoint: THREE.Vector3, isDrag: boolean) { if (!grab) return;
    if (grab.head && isDrag) {
      const distance = worldPoint.x - grab.turnX;
      const turn = Math.sign(distance) * Math.max(0, Math.abs(distance) - 0.12) * 1.4;
      targetHeading = clamp(grab.heading + turn, -Math.PI / 2, Math.PI / 2);
    }
    grab.worldTarget.copy(worldPoint);
    grab.target.copy(worldPoint); object.worldToLocal(grab.target); if (!movementConstraint) { grab.target.x = clamp(grab.target.x, -4.5, 4.5); grab.target.z = clamp(grab.target.z, -4.5, 4.5); grab.target.y = clamp(grab.target.y, 0.08, 5.5); } grab.target.y = Math.max(0.08, grab.target.y); grab.drag = isDrag; if (isDrag) pressTarget = 0; }
  function simulate(dt: number) {
    if (grab?.head && grab.drag) {
      const difference = Math.atan2(Math.sin(targetHeading - object.rotation.y), Math.cos(targetHeading - object.rotation.y));
      const turn = difference * (1 - Math.exp(-dt * 8));
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
    const targetSquash = clock >= 0 && clock < 0.15 ? 0.27 * compliance : 0;
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
    if (clock >= 0) { const previous = clock; clock += dt; if (previous < 0.15 && clock >= 0.15) velocity.y = 3.5; if (clock > 1.3) clock = -1; }
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
  function reset() { object.rotation.y = targetHeading = 0; object.updateMatrixWorld(true); stretch.set(0, 0, 0); stretchVelocity.set(0, 0, 0); wobble.set(0, 0, 0); wobbleVelocity.set(0, 0, 0); body.set(0, 0, 0); velocity.set(0, 0, 0); squash = squashVelocity = press = pressVelocity = pressTarget = 0; clock = -1; grab = null; for (const limb of limbs) { limb.shift.set(0, 0, 0); limb.velocity.set(0, 0, 0); } render(lastTime); mechanicalShell.update(); }
  const materialVariants = createMaterialVariants(object, [{ material: gel, thickness: 1.1 }], [dark, blush]);
  const mechanicalShell = createMechanicalShell(parts.filter(surface => surface.mesh.material === gel).map((surface, i) => ({ mesh: surface.mesh, axis: 'y' as const, bands: i === 0 ? 4 : 5, sectors: i === 0 ? 6 : 1, progress: surface.handle >= 0 ? surface.along : undefined })));
  reset();
  return {
    object,
    deformAccessory(point, out) { deform(point.x, point.y, point.z, out, lastTime); },
    setMovementConstraint(constraint) { movementConstraint = constraint; constraint(body, velocity); },
    pick(raycaster) { const hit = mechanicalShell.pick(raycaster) ?? raycaster.intersectObjects(parts.map(part => part.mesh), false)[0]; if (!hit) return null; const part = parts.find(part => part.mesh === hit.object)!; return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: part.handle < 0 ? part.fin ? 'fin' : 'mantle' : `${part.handle < 8 ? 'arm' : 'tentacle'}-${part.handle + 1}`, handle: part.handle }; },
    beginGrab(hit: GrabHit) { const local = object.worldToLocal(hit.point.clone()); const anchor = body.clone(); if (hit.handle >= 0) anchor.add(limbs[hit.handle].tip).add(limbs[hit.handle].shift); grab = { handle: hit.handle, target: local.clone(), worldTarget: hit.point.clone(), offset: local.clone().sub(anchor), drag: false, head: hit.part === 'mantle', turnX: hit.point.x, heading: object.rotation.y }; pressPoint.copy(local).sub(body); pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab,
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05), steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps); render(time); mechanicalShell.update(); frame++; },
    poke() { grab = null; pressTarget = 0; clock = 0; }, reset,
    setParameters(next) {
      if (next.view !== undefined) { parameters.view = next.view; object.rotation.y = targetHeading = next.view === 'front' ? 0 : Math.PI / 2; object.updateMatrixWorld(true); }
      if (next.color) { parameters.color = next.color; gel.color.set(next.color); gel.attenuationColor.set(next.color).lerp(new THREE.Color('white'), 0.4); }
      if (next.material !== undefined) parameters.material = next.material;
      if (next.color || next.material !== undefined) { materialVariants.set(parameters.material); mechanicalShell.set(parameters.material); }
      if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1);
      if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1);
    },
    diagnostics() { return { armCount: 8, tentacleCount: 2, vertices: parts.reduce((sum, part) => sum + part.rest.length / 3, 0), bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab ? grab.handle < 0 ? 'mantle' : `arm-${grab.handle + 1}` : 'none', deformationAmplitude: stretch.length() + wobble.length(), localStretch: stretch.length(), inertialWobble: wobble.length(), maxLimbDisplacement: Math.max(...limbs.map(limb => limb.shift.length())), finite: Number.isFinite(body.lengthSq() + stretch.lengthSq() + wobble.lengthSq() + squash + limbs.reduce((sum, limb) => sum + limb.shift.lengthSq(), 0)), frames: frame }; },
    dispose() { mechanicalShell.dispose(); const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(materialVariants.materials); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } }); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); object.clear(); },
  };
}
