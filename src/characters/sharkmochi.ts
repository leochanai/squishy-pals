import * as THREE from 'three/webgpu';
import type { Character, CharacterParameters, GrabHit, MovementConstraint } from './types';

const clamp = THREE.MathUtils.clamp;
interface Part {
  mesh: THREE.Mesh;
  rest: Float32Array;
  handle: number;
  fin: boolean;
  along: Float32Array;
}

/** A rounded shark with a pointed snout, broad triangular dorsal fin and vertical crescent tail. */
export function createSharkMochi(): Character {
  const CENTER = new THREE.Vector3(0, 1.24, 0);
  const object = new THREE.Group();
  object.name = 'SharkMochi';
  object.rotation.y = Math.PI - 0.18;
  let movementConstraint: MovementConstraint | undefined;
  const parameters: CharacterParameters = { color: '#5f7d92', stiffness: 0.48, damping: 0.42 };
  const gel = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  const bodyMaterial = new THREE.MeshPhysicalNodeMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#080a10', roughness: 0.13, clearcoat: 0.7 });
  const mouthMaterial = new THREE.MeshStandardNodeMaterial({ color: '#374e5c', roughness: 0.65 });
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
  // Longitudinal cross-sections: blunt forehead, broad belly, tapered raised peduncle.
  const stations = [
    [-1.96, 1.27, 0, 0], [-1.85, 1.27, 0.28, 0.30],
    [-1.51, 1.25, 0.61, 0.59], [-1.00, 1.16, 0.88, 0.79],
    [-0.39, 1.09, 1.00, 0.86], [0.18, 1.03, 0.93, 0.80],
    [0.72, 1.06, 0.66, 0.60], [1.13, 1.12, 0.36, 0.34],
    [1.48, 1.17, 0.19, 0.18], [1.72, 1.20, 0.14, 0.13],
    [1.91, 1.23, 0, 0],
  ];
  function section(t: number) {
    const scaled = clamp(t, 0, 1) * (stations.length - 1), i = Math.min(stations.length - 2, Math.floor(scaled)), f = scaled - i;
    return stations[0].map((_, axis) => {
      const a = stations[Math.max(0, i - 1)][axis], b = stations[i][axis], c = stations[i + 1][axis], d = stations[Math.min(stations.length - 1, i + 2)][axis];
      const value = 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
      return axis > 1 ? Math.max(0, value) : value;
    });
  }
  const vertices: number[] = [], indices: number[] = [], bellyWeights: number[] = [];
  const rows = 112, columns = 72;
  for (let i = 0; i <= rows; i++) {
    const [x, centerY, height, width] = section(i / rows);
    for (let j = 0; j <= columns; j++) {
      const theta = j / columns * Math.PI * 2;
      const belly = 1 - THREE.MathUtils.smoothstep(Math.sin(theta), -0.25, -0.19);
      const pleat = 0;
      vertices.push(x, centerY + (height + pleat) * Math.sin(theta), (width + pleat) * Math.cos(theta));
      bellyWeights.push(belly);
      if (i < rows && j < columns) {
        const a = i * (columns + 1) + j, c = i * (columns + 1) + (j + 1) % columns;
        const b = (i + 1) * (columns + 1) + j, d = (i + 1) * (columns + 1) + (j + 1) % columns;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  const mantle = new THREE.BufferGeometry();
  mantle.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); mantle.setIndex(indices);
  const bodyColors = new THREE.Float32BufferAttribute(new Float32Array(vertices.length), 3);
  mantle.setAttribute('color', bodyColors);
  const ivory = new THREE.Color('#e3e8e9'), coat = new THREE.Color(parameters.color), mixed = new THREE.Color();
  function colorBody() {
    coat.set(parameters.color);
    for (let i = 0; i < bodyColors.count; i++) { mixed.copy(coat).lerp(ivory, bellyWeights[i]); bodyColors.setXYZ(i, mixed.r, mixed.g, mixed.b); }
    bodyColors.needsUpdate = true;
  }
  colorBody(); add(mantle); parts[0].mesh.material = bodyMaterial;
  parts[0].mesh.name = 'shark-body';

  // Closed swept paddles have rounded leading edges and gently curled tips.
  function paddle(root: THREE.Vector3, middle: THREE.Vector3, tip: THREE.Vector3, width: number, thickness: number, label: string) {
    const handle = limbs.length;
    limbs.push({ root, tip, shift: new THREE.Vector3(), velocity: new THREE.Vector3() });
    const curve = new THREE.CatmullRomCurve3([root, middle, tip]);
    const frames = curve.computeFrenetFrames(40, false);
    const vertices: number[] = [], indices: number[] = [];
    const wide = new THREE.Vector3(), thin = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, point = curve.getPoint(t), tangent = curve.getTangent(t);
      wide.crossVectors(up, tangent).normalize();
      if (wide.lengthSq() < 0.001) wide.copy(frames.normals[i]);
      thin.crossVectors(tangent, wide).normalize();
      const envelope = Math.pow(Math.sin(Math.PI * t), 0.65);
      for (let j = 0; j <= 24; j++) {
        const angle = j / 24 * Math.PI * 2;
        vector.copy(point).addScaledVector(wide, Math.cos(angle) * width * envelope).addScaledVector(thin, Math.sin(angle) * thickness * envelope);
        vertices.push(vector.x, vector.y, vector.z);
        if (i < 40 && j < 24) { const a = i * 25 + j, c = i * 25 + (j + 1) % 24, b = (i + 1) * 25 + j, d = (i + 1) * 25 + (j + 1) % 24; indices.push(a, c, b, b, c, d); }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
    add(geometry, handle, true); parts[parts.length - 1].mesh.name = label;
  }
  function blade(points: number[][], root: THREE.Vector3, tip: THREE.Vector3, thickness: number, name: string) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 2) {
      const control = points[i], end = points[Math.min(i + 1, points.length - 1)];
      shape.quadraticCurveTo(control[0], control[1], end[0], end[1]);
    }
    shape.closePath();
    // Sweep elliptical sections through the curved outline. This creates a
    // rounded solid fin without the planar cap triangulation of an extrusion.
    const outline = shape.getPoints(64);
    const minY = Math.min(...outline.map(point => point.y)), maxY = Math.max(...outline.map(point => point.y));
    const vertices: number[] = [], indices: number[] = [];
    const rows = 56, columns = 32;
    for (let i = 0; i <= rows; i++) {
      const y = THREE.MathUtils.lerp(minY + 0.00001, maxY - 0.00001, i / rows);
      const intersections: number[] = [];
      for (let edge = 0; edge < outline.length; edge++) {
        const a = outline[edge], b = outline[(edge + 1) % outline.length];
        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) intersections.push(a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y));
      }
      const left = Math.min(...intersections), right = Math.max(...intersections), centerX = (left + right) / 2;
      const end = i === 0 || i === rows;
      const radius = end ? 0 : (right - left) / 2;
      const along = clamp((y - root.y) / (tip.y - root.y), 0, 1);
      const depth = end ? 0 : Math.min(radius * 0.7, (thickness * 1.6 + 0.035) * Math.pow(1 - along, 0.65) + 0.02);
      for (let j = 0; j <= columns; j++) {
        const theta = j / columns * Math.PI * 2;
        vertices.push(centerX + radius * Math.cos(theta), y, depth * Math.sin(theta));
        if (i < rows && j < columns) { const a = i * (columns + 1) + j, b = a + columns + 1, c = i * (columns + 1) + (j + 1) % columns, d = c + columns + 1; indices.push(a, b, c, b, d, c); }
      }
    }
    const smoothGeometry = new THREE.BufferGeometry();
    smoothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); smoothGeometry.setIndex(indices);
    const handle = limbs.length;
    limbs.push({ root, tip, shift: new THREE.Vector3(), velocity: new THREE.Vector3() });
    add(smoothGeometry, handle, true); parts[parts.length - 1].mesh.name = name;
  }
  blade([[1.43,1.10],[1.73,1.56],[2.27,2.42],[2.43,2.62],[2.37,2.33],[2.22,1.74],[1.97,1.16],[1.75,1.01],[1.43,1.10]], new THREE.Vector3(1.47,1.15,0), new THREE.Vector3(2.34,2.43,0), 0.08, 'upper-tail');
  blade([[1.44,1.20],[1.72,1.07],[2.24,0.29],[2.47,0.03],[2.19,0.17],[1.78,0.51],[1.51,0.90],[1.45,1.02],[1.44,1.20]], new THREE.Vector3(1.47,1.15,0), new THREE.Vector3(2.25,0.23,0), 0.08, 'lower-tail');
  for (const side of [-1, 1]) paddle(new THREE.Vector3(-0.1,0.82,side*0.60), new THREE.Vector3(0.18,0.48,side*1.07), new THREE.Vector3(0.79,0.22,side*1.41), 0.44, 0.13, `pectoral-fin-${side}`);
  blade([[-0.65,1.88],[-0.55,2.16],[-0.57,2.64],[-0.62,3.04],[-0.33,2.83],[0.1,2.55],[0.29,2.13],[0.46,1.87],[0.72,1.77],[0.0,1.88],[-0.65,1.88]], new THREE.Vector3(0,1.85,0), new THREE.Vector3(-0.45,2.88,0), 0.12, 'dorsal-fin');
  blade([[0.98,1.30],[1.12,1.53],[1.15,1.81],[1.33,1.69],[1.48,1.25],[1.26,1.31],[0.98,1.30]], new THREE.Vector3(1.23,1.35,0), new THREE.Vector3(1.18,1.75,0), 0.04, 'rear-dorsal-fin');
  const face: { mesh: THREE.Mesh; rest: THREE.Vector3; eye: boolean; normal: THREE.Vector3 }[] = [];
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  function sidePoint(x: number, y: number, side: number, offset = 0.025) {
    let low = 0, high = 1;
    for (let i = 0; i < 28; i++) { const mid = (low + high) / 2; if (section(mid)[0] < x) low = mid; else high = mid; }
    const [, cy, ry, rz] = section((low + high) / 2);
    return new THREE.Vector3(x, y, side * (rz * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) + offset));
  }
  function detail(mesh: THREE.Mesh, rest: THREE.Vector3, normal: THREE.Vector3, eye = false) { object.add(mesh); face.push({ mesh, rest, normal, eye }); }
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, dark); eye.name = side < 0 ? 'left-eye' : 'right-eye'; eye.scale.set(0.17, 0.19, 0.11);
    detail(eye, sidePoint(-1.03, 1.22, side, 0.045), new THREE.Vector3(-0.08, 0, side).normalize(), true);
    const points = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39, x = -1.84 + t * 0.61, y = 0.99 - 0.10 * Math.sin(t * Math.PI);
      return sidePoint(x, y, side, 0.023);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.019, 8, false), mouthMaterial);
    // Keep the smile in body coordinates so it can share the body deformation exactly.
    add(mesh.geometry); parts[parts.length - 1].mesh.material = mouthMaterial;
    parts[parts.length - 1].mesh.name = 'smile';
  }
  for (const side of [-1, 1]) for (let gill = 0; gill < 3; gill++) {
    const points = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      return sidePoint(-0.61 + gill * 0.14 - 0.05 * Math.sin(t * Math.PI), 1.34 - t * 0.38, side, 0.012);
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.013, 7, false));
    parts[parts.length - 1].mesh.material = mouthMaterial; parts[parts.length - 1].mesh.name = 'gill';
  }
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
    if (fin) out.z += 0.028 * Math.sin(time * 1.6 + x * 1.2) * along * along;
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
      if (item.eye) item.mesh.scale.y = 0.19 * blink * (1 - squash);
    }

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
    if (movementConstraint) movementConstraint(body, velocity);
    else {
      for (const axis of ['x', 'z'] as const) if (Math.abs(body[axis]) > 2.6) { body[axis] = clamp(body[axis], -2.6, 2.6); velocity[axis] *= 0.1; }
      if (body.y > 3.5) { body.y = 3.5; velocity.y = Math.min(0, velocity.y); }
    }
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
    setMovementConstraint(constraint) { movementConstraint = constraint; constraint(body, velocity); },
    pick(raycaster) { const hit = raycaster.intersectObjects(parts.map(part => part.mesh), false)[0]; if (!hit) return null; const part = parts.find(part => part.mesh === hit.object)!; return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: part.handle < 0 ? 'body' : `fin-${part.handle + 1}`, handle: part.handle }; },
    beginGrab(hit: GrabHit) { const local = object.worldToLocal(hit.point.clone()); const anchor = body.clone(); if (hit.handle >= 0) anchor.add(limbs[hit.handle].tip).add(limbs[hit.handle].shift); grab = { handle: hit.handle, target: local.clone(), offset: local.clone().sub(anchor), drag: false }; pressPoint.copy(local).sub(body); pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab(worldPoint, isDrag) { if (!grab) return; grab.target.copy(worldPoint); object.worldToLocal(grab.target); if (!movementConstraint) { grab.target.x = clamp(grab.target.x, -4.5, 4.5); grab.target.z = clamp(grab.target.z, -4.5, 4.5); grab.target.y = clamp(grab.target.y, 0.08, 5.5); } grab.target.y = Math.max(0.08, grab.target.y); grab.drag = isDrag; if (isDrag) pressTarget = 0; },
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05), steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps); render(time); frame++; },
    poke() { grab = null; pressTarget = 0; clock = 0; }, reset,
    setParameters(next) { if (next.color) { parameters.color = next.color; gel.color.set(next.color); colorBody(); } if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1); if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1); },
    diagnostics() { return { finCount: 6, tailLobes: 2, tailPlane: 'vertical', eyeCount: face.filter(item => item.eye).length, vertices: parts.reduce((sum, part) => sum + part.rest.length / 3, 0), bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab ? grab.handle < 0 ? 'body' : `fin-${grab.handle + 1}` : 'none', deformationAmplitude: stretch.length() + wobble.length(), localStretch: stretch.length(), inertialWobble: wobble.length(), maxLimbDisplacement: Math.max(...limbs.map(limb => limb.shift.length())), finite: Number.isFinite(body.lengthSq() + stretch.lengthSq() + wobble.lengthSq() + squash + limbs.reduce((sum, limb) => sum + limb.shift.lengthSq(), 0)), frames: frame }; },
    dispose() { const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } }); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); object.clear(); },
  };
}
