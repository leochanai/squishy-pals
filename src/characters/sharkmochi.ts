import * as THREE from 'three/webgpu';
import { createMechanicalShell } from './mechanical-shell.ts';
import { createMaterialVariants } from './materials.ts';
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
  const defaultHeading = Math.PI / 2;
  object.rotation.y = defaultHeading;
  let targetHeading = defaultHeading;
  const yawAxis = new THREE.Vector3(0, 1, 0);
  let movementConstraint: MovementConstraint | undefined;
  const parameters: CharacterParameters = { material: 'original', color: '#5f7d92', stiffness: 0.48, damping: 0.42 };
  const gel = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  const bodyMaterial = new THREE.MeshPhysicalNodeMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#080a10', roughness: 0.13, clearcoat: 0.7 });
  const mouthMaterial = new THREE.MeshStandardNodeMaterial({ color: '#7b8588', roughness: 0.9 });
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
    [-2.02, 1.28, 0, 0], [-1.88, 1.27, 0.26, 0.28],
    [-1.50, 1.22, 0.59, 0.65], [-0.96, 1.14, 0.84, 0.91],
    [-0.39, 1.09, 0.95, 0.96], [0.18, 1.06, 0.90, 0.82],
    [0.66, 1.06, 0.69, 0.61], [1.02, 1.12, 0.43, 0.37],
    [1.32, 1.17, 0.25, 0.21], [1.52, 1.20, 0.19, 0.15],
    [1.72, 1.23, 0, 0],
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
      const y = centerY + height * Math.sin(theta), z = width * Math.cos(theta);
      // One continuous chin-to-tail boundary avoids a separate frontal bib.
      const chinEdge = centerY - height * 0.22
        + 0.13 * Math.exp(-(((x + 1.55) / 0.75) ** 2))
        + 0.035 * Math.exp(-((z / 0.32) ** 2));
      const belly = 1 - THREE.MathUtils.smoothstep(y, chinEdge - 0.04, chinEdge + 0.04);
      vertices.push(x, y, z);
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

  // Paired fins broaden near the body, then taper along a swept leading edge.
  // Keep a rounded cross-section without the swollen middle of a flipper.
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
      const envelope = THREE.MathUtils.smoothstep(t, 0, 0.16) * Math.pow(1 - t, 0.9) / 0.85;
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
    const outline = shape.getPoints(96);
    const minY = Math.min(...outline.map(point => point.y)), maxY = Math.max(...outline.map(point => point.y));
    const vertices: number[] = [], indices: number[] = [];
    const rows = 84, columns = 48;
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
  blade([[1.26,1.05],[1.45,1.70],[1.91,2.21],[2.14,2.43],[2.12,2.12],[2.07,1.66],[1.77,1.25],[1.55,1.01],[1.26,1.05]], new THREE.Vector3(1.36,1.15,0), new THREE.Vector3(2.07,2.24,0), 0.14, 'upper-tail');
  blade([[1.29,1.27],[1.52,1.14],[1.96,0.57],[2.18,0.23],[1.89,0.32],[1.48,0.46],[1.32,0.91],[1.28,1.10],[1.29,1.27]], new THREE.Vector3(1.36,1.15,0), new THREE.Vector3(2.02,0.39,0), 0.14, 'lower-tail');
  for (const side of [-1, 1]) paddle(new THREE.Vector3(-0.35,0.80,side*0.55), new THREE.Vector3(-0.03,0.70,side*1.10), new THREE.Vector3(0.60,0.56,side*1.52), 0.42, 0.095, `pectoral-fin-${side}`);
  blade([[-0.66,1.54],[-0.55,2.06],[-0.49,2.55],[-0.49,2.91],[-0.23,2.75],[0.17,2.48],[0.39,2.08],[0.60,1.62],[0.74,1.40],[0.02,1.48],[-0.66,1.54]], new THREE.Vector3(0,1.55,0), new THREE.Vector3(-0.33,2.76,0), 0.22, 'dorsal-fin');
  blade([[0.93,1.35],[1.02,1.53],[1.08,1.68],[1.24,1.65],[1.39,1.30],[1.20,1.36],[0.93,1.35]], new THREE.Vector3(1.15,1.39,0), new THREE.Vector3(1.11,1.65,0), 0.07, 'rear-dorsal-fin');
  for (const side of [-1, 1]) paddle(new THREE.Vector3(0.57,0.66,side*0.29), new THREE.Vector3(0.73,0.59,side*0.43), new THREE.Vector3(0.99,0.56,side*0.59), 0.16, 0.045, `pelvic-fin-${side}`);
  blade([[0.96,0.77],[1.00,0.64],[1.15,0.59],[1.26,0.55],[1.22,0.70],[1.18,0.79],[1.18,0.90],[1.06,0.82],[0.96,0.77]], new THREE.Vector3(1.08,0.79,0), new THREE.Vector3(1.23,0.60,0), 0.035, 'anal-fin');
  const face: { mesh: THREE.Mesh; rest: THREE.Vector3; eye: boolean; normal: THREE.Vector3 }[] = [];
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  function detail(mesh: THREE.Mesh, rest: THREE.Vector3, normal: THREE.Vector3, eye = false) { object.add(mesh); face.push({ mesh, rest, normal, eye }); }
  const snout = parts[0].mesh.clone(false);
  snout.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, dark); eye.name = side < 0 ? 'left-eye' : 'right-eye'; eye.scale.set(0.095, 0.13, 0.055);
    ray.set(new THREE.Vector3(-1.05, 1.43, side * 5), new THREE.Vector3(0, 0, -side));
    const eyeHit = ray.intersectObject(snout, false)[0]!;
    const eyeNormal = eyeHit.face!.normal.clone().normalize();
    detail(eye, eyeHit.point.clone().addScaledVector(eyeNormal, 0.025), eyeNormal, true);
  }
  // A shallow continuous smile follows the lower jaw and rises at each
  // cheek, sunk into the skin like a crease.
  const smilePoints = Array.from({ length: 161 }, (_, i) => {
    const u = i / 80 - 1, angle = u * 1.12;
    const direction = new THREE.Vector3(-Math.cos(angle), 0, Math.sin(angle));
    const y = 0.85 + 0.23 * Math.sin(angle) ** 4;
    const origin = new THREE.Vector3(-0.66, y, 0);
    ray.set(origin.addScaledVector(direction, 5), direction.clone().negate());
    const hit = ray.intersectObject(snout, false)[0]!;
    return hit.point.clone().addScaledVector(hit.face!.normal, 0.003);
  });
  const smile = new THREE.CatmullRomCurve3(smilePoints);
  add(new THREE.TubeGeometry(smile, 240, 0.010, 8, false));
  parts[parts.length - 1].mesh.material = mouthMaterial;
  parts[parts.length - 1].mesh.name = 'smile';
  for (const side of [-1, 1]) for (let gill = 0; gill < 5; gill++) {
    const points = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      const point = new THREE.Vector3(-0.85 + gill * 0.12 - 0.035 * Math.sin(t * Math.PI), 1.48 - t * 0.36, side * 5);
      ray.set(point, new THREE.Vector3(0, 0, -side));
      const hit = ray.intersectObject(snout, false)[0]!;
      return hit.point.clone().addScaledVector(hit.face!.normal, 0.009);
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
  const eyeUp = new THREE.Vector3(), eyeRight = new THREE.Vector3();
  const eyeBasis = new THREE.Matrix4();
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
      eyeUp.set(0, 1, 0).addScaledVector(faceNormal, -faceNormal.y).normalize();
      eyeRight.crossVectors(eyeUp, faceNormal).normalize();
      eyeBasis.makeBasis(eyeRight, eyeUp, faceNormal);
      item.mesh.quaternion.setFromRotationMatrix(eyeBasis);
      if (item.eye) item.mesh.scale.y = 0.13 * blink * (1 - squash);
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
  function reset() { object.rotation.y = targetHeading = defaultHeading; object.updateMatrixWorld(true); stretch.set(0, 0, 0); stretchVelocity.set(0, 0, 0); wobble.set(0, 0, 0); wobbleVelocity.set(0, 0, 0); body.set(0, 0, 0); velocity.set(0, 0, 0); squash = squashVelocity = press = pressVelocity = pressTarget = 0; clock = -1; grab = null; for (const limb of limbs) { limb.shift.set(0, 0, 0); limb.velocity.set(0, 0, 0); } render(lastTime); mechanicalShell.update(); }
  const materialVariants = createMaterialVariants(object, [{ material: gel, thickness: 0.25 }, { material: bodyMaterial, thickness: 1 }], [dark, mouthMaterial]);
  const mechanicalShell = createMechanicalShell(parts.filter(surface => surface.mesh.material === gel || surface.mesh.material === bodyMaterial).map((surface, i) => ({ mesh: surface.mesh, axis: 'x' as const, bands: i === 0 ? 4 : 5, sectors: i === 0 ? 6 : 1, progress: surface.handle >= 0 ? surface.along : undefined })));
  reset();
  return {
    object,
    deformAccessory(point, out) { deform(point.x, point.y, point.z, out, lastTime); },
    setMovementConstraint(constraint) { movementConstraint = constraint; constraint(body, velocity); },
    pick(raycaster) { const hit = mechanicalShell.pick(raycaster) ?? raycaster.intersectObjects(parts.map(part => part.mesh), false)[0]; if (!hit) return null; const part = parts.find(part => part.mesh === hit.object)!; return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: part.handle < 0 ? 'body' : `fin-${part.handle + 1}`, handle: part.handle }; },
    beginGrab(hit: GrabHit) { const local = object.worldToLocal(hit.point.clone()); const anchor = body.clone(); if (hit.handle >= 0) anchor.add(limbs[hit.handle].tip).add(limbs[hit.handle].shift); pressPoint.copy(local).sub(body); targetHeading = object.rotation.y; grab = { handle: hit.handle, target: local.clone(), worldTarget: hit.point.clone(), offset: local.clone().sub(anchor), drag: false, head: hit.handle < 0 && pressPoint.x < -0.65, turnX: hit.point.x, heading: object.rotation.y }; pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab,
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05), steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps); render(time); mechanicalShell.update(); frame++; },
    poke() { grab = null; pressTarget = 0; clock = 0; }, reset,
    setParameters(next) {
      if (next.view !== undefined) { parameters.view = next.view; object.rotation.y = targetHeading = next.view === 'front' ? defaultHeading : 0; object.updateMatrixWorld(true); }
      if (next.color) { parameters.color = next.color; gel.color.set(next.color); colorBody(); }
      if (next.material !== undefined) parameters.material = next.material;
      if (next.color || next.material !== undefined) { materialVariants.set(parameters.material); mechanicalShell.set(parameters.material); }
      if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1);
      if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1);
    },
    diagnostics() { return { finCount: limbs.length, tailLobes: 2, tailPlane: 'vertical', eyeCount: face.filter(item => item.eye).length, vertices: parts.reduce((sum, part) => sum + part.rest.length / 3, 0), bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab ? grab.handle < 0 ? 'body' : `fin-${grab.handle + 1}` : 'none', deformationAmplitude: stretch.length() + wobble.length(), localStretch: stretch.length(), inertialWobble: wobble.length(), maxLimbDisplacement: Math.max(...limbs.map(limb => limb.shift.length())), finite: Number.isFinite(body.lengthSq() + stretch.lengthSq() + wobble.lengthSq() + squash + limbs.reduce((sum, limb) => sum + limb.shift.lengthSq(), 0)), frames: frame }; },
    dispose() { mechanicalShell.dispose(); const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(materialVariants.materials); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material)); } }); geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); object.clear(); },
  };
}
