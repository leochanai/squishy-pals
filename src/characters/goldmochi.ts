import * as THREE from 'three/webgpu';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Character, CharacterParameters, GrabHit } from './types';

const clamp = THREE.MathUtils.clamp;
const CENTER = new THREE.Vector3(0, 1.28, 0.2);
const RADII = new THREE.Vector3(1.03, 1.18, 1.09);
interface Part {
  mesh: THREE.Mesh;
  rest: Float32Array;
  handle: number;
  fin: boolean;
  along: Float32Array;
}

/** A round fancy goldfish with a split fan tail and flowing paired fins. */
export function createGoldMochi(): Character {
  const object = new THREE.Group();
  object.name = 'GoldMochi';
  object.rotation.y = -0.72;
  const parameters: CharacterParameters = { color: '#f08610', stiffness: 0.48, damping: 0.42 };
  const gel = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.52, clearcoat: 0.14, clearcoatRoughness: 0.5 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#110d08', roughness: 0.16, clearcoat: 0.7 });
  const parts: Part[] = [];
  const limbs: { tip: THREE.Vector3; root: THREE.Vector3; shift: THREE.Vector3; velocity: THREE.Vector3 }[] = [];
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
    for (let i = 0; i < along.length; i++) along[i] = handle < 0 ? 0 : clamp(vector.fromBufferAttribute(attribute, i).distanceTo(limbs[handle].root) / limbs[handle].root.distanceTo(limbs[handle].tip), 0, 1);
    parts.push({ mesh, rest: new Float32Array(attribute.array), handle, fin, along });
  }
  const mantle = new THREE.SphereGeometry(1, 64, 40);
  mantle.scale(RADII.x, RADII.y, RADII.z).translate(CENTER.x, CENTER.y, CENTER.z);
  add(mantle);

  const finMaterial = new THREE.MeshPhysicalNodeMaterial({ vertexColors: true, roughness: 0.52, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  const finColors: { colors: THREE.BufferAttribute; progress: THREE.BufferAttribute }[] = [];
  function colorFins() {
    const root = new THREE.Color(parameters.color), tip = root.clone().lerp(new THREE.Color('#ffe49a'), 0.28), mixed = new THREE.Color();
    for (const fin of finColors) {
      for (let i = 0; i < fin.colors.count; i++) { mixed.copy(root).lerp(tip, THREE.MathUtils.smoothstep(fin.progress.getX(i), 0.08, 1)); fin.colors.setXYZ(i, mixed.r, mixed.g, mixed.b); }
      fin.colors.needsUpdate = true;
    }
  }
  // Two gently corrugated surfaces meet at a rounded rim, giving every fan
  // volume and soft highlights rather than rendering it as a flat triangle.
  function fan(root: THREE.Vector3, tip: THREE.Vector3, width: THREE.Vector3, label: string, thickness: number) {
    const handle = limbs.length;
    limbs.push({ root, tip, shift: new THREE.Vector3(), velocity: new THREE.Vector3() });
    const vertices: number[] = [], indices: number[] = [], progress: number[] = [];
    const rows = 40, columns = 40, layerSize = (rows + 1) * (columns + 1);
    const direction = tip.clone().sub(root), normal = new THREE.Vector3().crossVectors(direction, width).normalize();
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      for (let j = 0; j <= columns; j++) {
        const v = j / columns * 2 - 1, angle = v * 1.14;
        const notch = label.startsWith('tail') ? 1 - 0.19 * Math.exp(-((v / 0.21) ** 2)) : 1;
        const scallop = 1 + 0.016 * Math.cos(v * Math.PI * 5);
        const length = t * Math.cos(angle * 0.72) * notch * scallop;
        vector.copy(root).addScaledVector(direction, length).addScaledVector(width, Math.sin(angle) * t);
        const envelope = Math.pow(Math.sin(Math.PI * t), 0.55) * Math.pow(Math.max(0, 1 - v * v), 0.4);
        const grooves = 0.005 * Math.cos(v * Math.PI * 6) * Math.sin(Math.PI * t) * (1 - v * v);
        vector.addScaledVector(normal, grooves + (layer === 0 ? 1 : -1) * thickness * envelope);
        vertices.push(vector.x, vector.y, vector.z); progress.push(t);
        if (i < rows && j < columns) {
          const a = layer * layerSize + i * (columns + 1) + j, b = a + columns + 1;
          if (layer === 0) indices.push(a, b, a + 1, b, b + 1, a + 1);
          else indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }
    const source = new THREE.BufferGeometry(); source.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); source.setAttribute('finProgress', new THREE.Float32BufferAttribute(progress, 1)); source.setIndex(indices);
    const geometry = mergeVertices(source, 0.00001); source.dispose();
    const colors = new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3);
    geometry.setAttribute('color', colors);
    finColors.push({ colors, progress: geometry.getAttribute('finProgress') as THREE.BufferAttribute });
    add(geometry, handle, true); parts[parts.length - 1].mesh.material = finMaterial; parts[parts.length - 1].mesh.name = label;
  }
  for (const side of [-1, 1]) {
    fan(new THREE.Vector3(side * 0.08, 1.21, -0.66), new THREE.Vector3(side * 0.26, 1.24, -2.43), new THREE.Vector3(0, 1.27, 0), `tail-${side}`, 0.075);
    fan(new THREE.Vector3(side * 0.78, 1.05, 0.37), new THREE.Vector3(side * 1.53, 0.87, 0.48), new THREE.Vector3(0, 0.42, -0.12), `pectoral-fin-${side}`, 0.09);
  }
  fan(new THREE.Vector3(0, 2.02, -0.3), new THREE.Vector3(0, 3.07, -0.46), new THREE.Vector3(0, 0, 0.9), 'dorsal-fin', 0.065);
  colorFins();
  const face: { mesh: THREE.Mesh; rest: THREE.Vector3; eye: boolean; normal: THREE.Vector3 }[] = [];
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  function facePoint(x: number, y: number) {
    const radius = Math.sqrt(Math.max(0, 1 - ((y - CENTER.y) / RADII.y) ** 2));
    const angle = Math.asin(x / (RADII.x * radius)) + 0.2;
    return new THREE.Vector3((RADII.x * radius + 0.035) * Math.sin(angle), y, CENTER.z + (RADII.z * radius + 0.035) * Math.cos(angle));
  }
  function detail(mesh: THREE.Mesh, rest: THREE.Vector3, eye = false) { object.add(mesh); face.push({ mesh, rest, eye, normal: new THREE.Vector3(rest.x / RADII.x ** 2, (rest.y - CENTER.y) / RADII.y ** 2, (rest.z - CENTER.z) / RADII.z ** 2).normalize() }); }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, dark); eye.name = side < 0 ? 'left-eye' : 'right-eye'; eye.scale.set(0.14, 0.17, 0.09); detail(eye, facePoint(side * 0.42, 1.31), true);
  }
  const smile = new THREE.Shape(); smile.moveTo(-0.17, 0.02); smile.quadraticCurveTo(-0.04, -0.005, 0, 0.015); smile.quadraticCurveTo(0.05, -0.005, 0.17, 0.02); smile.quadraticCurveTo(0.12, -0.145, 0, -0.145); smile.quadraticCurveTo(-0.12, -0.145, -0.17, 0.02);
  const mouth = new THREE.Mesh(new THREE.ShapeGeometry(smile, 24), dark); detail(mouth, facePoint(0, 1.12));
  const surprised = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.019, 8, 20), dark); object.add(surprised); surprised.visible = false;
  const body = new THREE.Vector3(), velocity = new THREE.Vector3(), delta = new THREE.Vector3();
  const pressPoint = new THREE.Vector3(), pressNormal = new THREE.Vector3();
  const stretch = new THREE.Vector3(), stretchVelocity = new THREE.Vector3();
  const wobble = new THREE.Vector3(), wobbleVelocity = new THREE.Vector3();
  const previousVelocity = new THREE.Vector3(), force = new THREE.Vector3(), softTarget = new THREE.Vector3();
  const tangentX = new THREE.Vector3(), tangentY = new THREE.Vector3(), faceNormal = new THREE.Vector3();
  const front = new THREE.Vector3(0, 0, 1);
  let squash = 0, squashVelocity = 0, press = 0, pressTarget = 0, clock = -1, frame = 0, lastTime = 0;
  let grab: { handle: number; target: THREE.Vector3; offset: THREE.Vector3; drag: boolean } | null = null;
  function deform(x: number, y: number, z: number, out: THREE.Vector3, time: number, fin = false, handle = -1, along = 0) {
    out.set(x * (1 + squash * 0.35), 0.18 + (y - 0.18) * (1 - squash), z * (1 + squash * 0.22)).add(body);
    // Every surface uses this same material-space field, including the face and
    // overlapping fin/arm roots. A pull travels through the body rather than
    // translating a rigid mantle while its appendages move independently.
    const reach = (x - pressPoint.x) ** 2 + (y - pressPoint.y) ** 2 + (z - pressPoint.z) ** 2;
    out.addScaledVector(stretch, Math.exp(-reach / 1.65));
    out.addScaledVector(wobble, clamp((y - 0.18) / 1.65, 0, 1) * (0.75 + 0.25 * Math.cos(z - CENTER.z)));
    if (fin) out.x += 0.09 * Math.sin(time * 3.2 + z * 2.5) * along * along;
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
      part.mesh.geometry.boundingSphere!.center.copy(body).add(CENTER); part.mesh.geometry.boundingSphere!.radius = 5;
    }
    const blink = time % 5.9 > 5.5 && time % 5.9 < 5.68 ? Math.max(0.08, Math.abs(time % 5.9 - 5.59) / 0.09) : 1;
    for (const item of face) {
      const { x, y, z } = item.rest;
      deform(x, y, z, item.mesh.position, time);
      const tangent = new THREE.Vector3(1, 0, 0).cross(item.normal).normalize();
      const bitangent = new THREE.Vector3().crossVectors(item.normal, tangent);
      deform(x + tangent.x * 0.02, y + tangent.y * 0.02, z + tangent.z * 0.02, tangentX, time); tangentX.sub(item.mesh.position);
      deform(x + bitangent.x * 0.02, y + bitangent.y * 0.02, z + bitangent.z * 0.02, tangentY, time); tangentY.sub(item.mesh.position);
      faceNormal.crossVectors(tangentX, tangentY).normalize();
      item.mesh.quaternion.setFromUnitVectors(front, faceNormal);
      if (item.eye) item.mesh.scale.y = 0.17 * blink * (1 - squash);
    }
    surprised.position.copy(mouth.position); surprised.quaternion.copy(mouth.quaternion); surprised.visible = Boolean(grab?.drag) || clock > 0.13 && clock < 0.5; mouth.visible = !surprised.visible;
  }
  function simulate(dt: number) {
    previousVelocity.copy(velocity);
    if (grab?.drag && grab.handle < 0) {
      delta.copy(grab.target).sub(grab.offset).sub(body); velocity.addScaledVector(delta, dt * 38); velocity.y -= 11 * dt; velocity.multiplyScalar(Math.exp(-dt * 8));
    } else {
      velocity.y -= 13 * dt; velocity.x -= body.x * dt * 2; velocity.z -= body.z * dt * 2;
      velocity.x *= Math.exp(-dt * 3); velocity.z *= Math.exp(-dt * 3);
    }
    body.addScaledVector(velocity, dt);
    if (body.y < 0) { const impact = Math.max(0, -velocity.y); body.y = 0; velocity.y = impact > 0.6 ? impact * (0.25 - parameters.damping * 0.12) : 0; squashVelocity += impact > 0.6 ? impact * 0.8 : 0; }
    for (const axis of ['x', 'z'] as const) if (Math.abs(body[axis]) > 2.6) { body[axis] = clamp(body[axis], -2.6, 2.6); velocity[axis] *= 0.1; }
    if (body.y > 3.5) { body.y = 3.5; velocity.y = Math.min(0, velocity.y); }
    const targetSquash = clock >= 0 && clock < 0.15 ? 0.27 : 0;
    squashVelocity += ((targetSquash - squash) * (100 + parameters.stiffness * 100) - squashVelocity * (7 + parameters.damping * 10)) * dt;
    squash = clamp(squash + squashVelocity * dt, -0.18, 0.42); press += (pressTarget - press) * Math.min(1, dt * 14);
    for (let i = 0; i < limbs.length; i++) {
      const limb = limbs[i]; delta.copy(limb.shift).negate();
      if (grab?.drag && grab.handle === i) { delta.copy(grab.target).sub(grab.offset).sub(body).sub(limb.tip).clampLength(0, 0.85).sub(limb.shift); velocity.addScaledVector(delta, dt * 8); }
      limb.velocity.addScaledVector(delta, dt * (28 + parameters.stiffness * 65)); limb.velocity.multiplyScalar(Math.exp(-dt * (3 + parameters.damping * 10))); limb.shift.addScaledVector(limb.velocity, dt).clampLength(0, 0.85);
    }
    if (clock >= 0) { const previous = clock; clock += dt; if (previous < 0.15 && clock >= 0.15) velocity.y = 3.5; if (clock > 1.3) clock = -1; }
    softTarget.set(0, 0, 0);
    if (grab?.drag) {
      softTarget.copy(grab.target).sub(grab.offset).sub(body);
      if (grab.handle >= 0) softTarget.sub(limbs[grab.handle].tip).multiplyScalar(0.55);
      softTarget.multiplyScalar(1.5 - parameters.stiffness * 0.55).clampLength(0, 0.95);
    }
    const spring = 38 + parameters.stiffness * 55, drag = 4 + parameters.damping * 7;
    force.copy(softTarget).sub(stretch).multiplyScalar(spring).addScaledVector(stretchVelocity, -drag);
    stretchVelocity.addScaledVector(force, dt); stretch.addScaledVector(stretchVelocity, dt).clampLength(0, 1.05);
    // Acceleration excites a separate, slower mantle mode. It survives release,
    // so throw/landing energy visibly travels through the animal before settling.
    softTarget.copy(previousVelocity).sub(velocity).multiplyScalar(0.014 / Math.max(dt, 0.0001)).clampLength(0, 0.45);
    force.copy(softTarget).sub(wobble).multiplyScalar(24 + parameters.stiffness * 30).addScaledVector(wobbleVelocity, -(3 + parameters.damping * 6));
    wobbleVelocity.addScaledVector(force, dt); wobble.addScaledVector(wobbleVelocity, dt).clampLength(0, 0.5);
  }
  function reset() { stretch.set(0, 0, 0); stretchVelocity.set(0, 0, 0); wobble.set(0, 0, 0); wobbleVelocity.set(0, 0, 0); body.set(0, 0, 0); velocity.set(0, 0, 0); squash = squashVelocity = press = pressTarget = 0; clock = -1; grab = null; for (const limb of limbs) { limb.shift.set(0, 0, 0); limb.velocity.set(0, 0, 0); } render(lastTime); }
  reset();
  return {
    object,
    pick(raycaster) { const hit = raycaster.intersectObjects(parts.map(part => part.mesh), false)[0]; if (!hit) return null; const part = parts.find(part => part.mesh === hit.object)!; return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: part.handle < 0 ? 'body' : `fin-${part.handle + 1}`, handle: part.handle }; },
    beginGrab(hit: GrabHit) { const local = object.worldToLocal(hit.point.clone()); const anchor = body.clone(); if (hit.handle >= 0) anchor.add(limbs[hit.handle].tip).add(limbs[hit.handle].shift); grab = { handle: hit.handle, target: local.clone(), offset: local.clone().sub(anchor), drag: false }; pressPoint.copy(local).sub(body); pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab(worldPoint, isDrag) { if (!grab) return; grab.target.copy(worldPoint); object.worldToLocal(grab.target); grab.target.x = clamp(grab.target.x, -4.5, 4.5); grab.target.z = clamp(grab.target.z, -4.5, 4.5); grab.target.y = clamp(grab.target.y, 0.08, 5.5); grab.drag = isDrag; if (isDrag) pressTarget = 0; },
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05), steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps); render(time); frame++; },
    poke() { grab = null; pressTarget = 0; clock = 0; }, reset,
    setParameters(next) { if (next.color) { parameters.color = next.color; gel.color.set(next.color); colorFins(); } if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1); if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1); },
    diagnostics() { return { finCount: 5, tailLobes: 2, vertices: parts.reduce((sum, part) => sum + part.rest.length / 3, 0), bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab ? grab.handle < 0 ? 'body' : `fin-${grab.handle + 1}` : 'none', deformationAmplitude: stretch.length() + wobble.length(), localStretch: stretch.length(), inertialWobble: wobble.length(), maxLimbDisplacement: Math.max(...limbs.map(limb => limb.shift.length())), finite: Number.isFinite(body.lengthSq() + stretch.lengthSq() + wobble.lengthSq() + squash + limbs.reduce((sum, limb) => sum + limb.shift.lengthSq(), 0)), frames: frame }; },
    dispose() { const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } }); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); object.clear(); },
  };
}
