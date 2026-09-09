import * as THREE from 'three/webgpu';
import { createMechanicalShell } from './mechanical-shell.ts';
import { createMaterialVariants } from './materials.ts';
import type { Character, CharacterParameters, GrabHit, MovementConstraint } from './types';

const clamp = THREE.MathUtils.clamp;
const FRONT = new THREE.Vector3(0, 0, 1);

export function createSquidMochi(): Character {
  const object = new THREE.Group();
  object.name = 'SquidMochi';
  const parameters: CharacterParameters = { material: 'original', color: '#f69b85', stiffness: 0.48, damping: 0.42 };
  const material = new THREE.MeshPhysicalNodeMaterial({ color: parameters.color, roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.4, transmission: 0.08, thickness: 1, ior: 1.38 });
  const dark = new THREE.MeshPhysicalNodeMaterial({ color: '#342426', roughness: 0.2, clearcoat: 0.6 });
  const blush = new THREE.MeshStandardNodeMaterial({ color: '#eb786e', roughness: 0.75 });
  let movementConstraint: MovementConstraint | undefined;
  const body = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  const pull = new THREE.Vector3(), pullVelocity = new THREE.Vector3();
  const sway = new THREE.Vector3(), swayVelocity = new THREE.Vector3();
  const fieldGoal = new THREE.Vector3();
  const faceX = new THREE.Vector3(), faceY = new THREE.Vector3(), faceZAxis = new THREE.Vector3();
  const faceMatrix = new THREE.Matrix4();
  let deformationAmplitude = 0;
  const limbs = Array.from({ length: 10 }, () => ({ offset: new THREE.Vector3(), velocity: new THREE.Vector3() }));
  const surfaces: { mesh: THREE.Mesh; rest: Float32Array; weights: Float32Array; handle: number }[] = [];
  const details: { mesh: THREE.Mesh; rest: THREE.Vector3; eye: boolean }[] = [];
  let grab: { hit: GrabHit; target: THREE.Vector3; anchor: THREE.Vector3; drag: boolean } | null = null;
  let squash = 0, squashVelocity = 0, press = 0, pressVelocity = 0, pressTarget = 0, pokeClock = -1, frames = 0, lastTime = 0;
  const pressPoint = new THREE.Vector3(), pressNormal = new THREE.Vector3();
  const point = new THREE.Vector3(), goal = new THREE.Vector3(), delta = new THREE.Vector3();

  function addSurface(geometry: THREE.BufferGeometry, handle: number, weight: (p: THREE.Vector3, i: number) => number) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = handle < 0 ? 'squid-mantle-fin' : `squid-arm-${handle + 1}`;
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    object.add(mesh);
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setUsage(THREE.DynamicDrawUsage);
    const weights = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) weights[i] = weight(point.fromBufferAttribute(positions, i), i);
    geometry.computeBoundingSphere();
    surfaces.push({ mesh, rest: new Float32Array(positions.array), weights, handle });
  }

  // A tapered mantle and two high triangular fins distinguish a squid from
  // the octopus's round head and the cuttlefish's broad skirt.
  const profile = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    return new THREE.Vector2(Math.pow(Math.sin(t * Math.PI), 0.72) * (1 - 0.5 * t), 0.67 + t * 2.73);
  });
  const mantle = new THREE.LatheGeometry(profile, 64);
  mantle.scale(1, 1, 0.84);
  addSurface(mantle, -1, () => 0);
  for (const sign of [-1, 1]) {
    const vertices: number[] = [], indices: number[] = [];
    const rows = 24, cols = 12;
    for (let layer = 0; layer < 2; layer++) {
      for (let r = 0; r <= rows; r++) {
        const t = r / rows, y = 1.96 + 1.29 * t;
        const width = Math.pow(Math.sin(Math.PI * t), 0.9) * (1.12 - 0.52 * t);
        const root = 0.4 - 0.26 * t;
        for (let c = 0; c <= cols; c++) {
          const u = c / cols;
          vertices.push(sign * (root + width * u), y - 0.18 * Math.sin(Math.PI * t) * u, (layer === 0 ? 1 : -1) * (0.016 + 0.105 * Math.sin(Math.PI * u)) * Math.sin(Math.PI * t));
        }
      }
    }
    const stride = (rows + 1) * (cols + 1);
    for (let layer = 0; layer < 2; layer++) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = layer * stride + r * (cols + 1) + c, b = a + cols + 1;
      if ((sign > 0) === (layer === 0)) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    for (let r = 0; r < rows; r++) {
      const a = r * (cols + 1) + cols, b = a + cols + 1;
      indices.push(a, b, a + stride, b, b + stride, a + stride);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    addSurface(geometry, -1, () => 0);
  }
  for (let i = 0; i < 10; i++) {
    const long = i >= 8;
    const angle = long ? (i === 8 ? -0.36 : 0.36) : -1.3 + i / 7 * 2.6;
    const length = long ? 2.66 : 1.55 + 0.15 * Math.cos(angle * 2);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(angle) * 0.34, 0.86, Math.cos(angle) * 0.3),
      new THREE.Vector3(Math.sin(angle) * 0.64, 0.46, 0.62),
      new THREE.Vector3(Math.sin(angle) * length * 0.9, 0.24, Math.cos(angle) * length * 0.79),
      new THREE.Vector3(Math.sin(angle) * length, long ? 0.29 : 0.35, Math.cos(angle) * length),
    ]);
    const geometry = new THREE.TubeGeometry(curve, 24, 1, 12, false);
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let j = 0; j < positions.count; j++) {
      const t = Math.floor(j / 13) / 24;
      const center = curve.getPointAt(t);
      const radius = long ? 0.14 - 0.055 * t + 0.085 * Math.exp(-(((t - 0.9) / 0.13) ** 2)) : 0.215 * (1 - t * 0.66);
      point.fromBufferAttribute(positions, j).sub(center).multiplyScalar(radius * (t === 1 ? 0 : Math.min(1, (1 - t) * 12 + 0.04))).add(center);
      positions.setXYZ(j, point.x, point.y, point.z);
    }
    // Keep the vertex numbering used by deformation weights, but share the
    // circumference seam and one closed tip in the rendered triangles.
    const sourceIndices = geometry.getIndex()!;
    const indices: number[] = [];
    const sharedIndex = (index: number) => index >= 24 * 13 ? 24 * 13 : index % 13 === 12 ? index - 12 : index;
    for (let j = 0; j < sourceIndices.count; j += 3) {
      const a = sharedIndex(sourceIndices.getX(j)), b = sharedIndex(sourceIndices.getX(j + 1)), c = sharedIndex(sourceIndices.getX(j + 2));
      if (a !== b && b !== c && c !== a) indices.push(a, b, c);
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    addSurface(geometry, i, (_, j) => (Math.floor(j / 13) / 24) ** 1.5);
  }
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const faceZ = (x: number, y: number) => {
    const t = (y - 0.67) / 2.73;
    const radius = Math.pow(Math.sin(t * Math.PI), 0.72) * (1 - 0.5 * t);
    return Math.sqrt(Math.max(0, radius * radius - x * x)) * 0.84 + 0.04;
  };
  for (const side of [-1, 1]) {
    for (const eye of [true, false]) {
      const mesh = new THREE.Mesh(sphere, eye ? dark : blush);
      const x = side * (eye ? 0.3 : 0.48), y = eye ? 1.47 : 1.26;
      mesh.scale.set(eye ? 0.12 : 0.135, eye ? 0.16 : 0.055, eye ? 0.075 : 0.025);
      const rest = new THREE.Vector3(x, y, faceZ(x, y));
      mesh.position.copy(rest); mesh.quaternion.setFromUnitVectors(FRONT, new THREE.Vector3(side * 0.28, 0, 1).normalize());
      object.add(mesh); details.push({ mesh, rest, eye });
    }
  }
  const smile = Array.from({ length: 17 }, (_, i) => new THREE.Vector3(Math.cos(Math.PI + i / 16 * Math.PI) * 0.12, Math.sin(Math.PI + i / 16 * Math.PI) * 0.07, 0));
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smile), 16, 0.021, 8, false), dark);
  const mouthRest = new THREE.Vector3(0, 1.31, faceZ(0, 1.31));
  object.add(mouth); details.push({ mesh: mouth, rest: mouthRest, eye: false });

  function deform(p: THREE.Vector3, handle: number, weight: number) {
    // One continuous rest-space field carries the mantle, fins, face and arm
    // roots together. A tug reaches the nearby surface before the body follows.
    const distance = p.distanceToSquared(pressPoint);
    const influence = Math.exp(-distance / 1.5);
    const bend = THREE.MathUtils.smoothstep(p.y, 0.35, 3.4);
    if (handle >= 0) p.addScaledVector(limbs[handle].offset, weight);
    p.addScaledVector(pull, influence).addScaledVector(sway, bend * bend);
    if (press > 0) p.addScaledVector(pressNormal, -press * Math.exp(-distance / 0.32));
    p.set(p.x * (1 + squash * 0.33), p.y * (1 - squash), p.z * (1 + squash * 0.22));
    p.add(body); p.y = Math.max(0.04, p.y);
    return p;
  }
  function render(time: number) {
    for (const surface of surfaces) {
      const positions = surface.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        deform(point.fromArray(surface.rest, i * 3), surface.handle, surface.weights[i]);
        positions.setXYZ(i, point.x, point.y, point.z);
      }
      positions.needsUpdate = true; surface.mesh.geometry.computeVertexNormals();
      surface.mesh.geometry.boundingSphere!.center.copy(body).add(new THREE.Vector3(0, 1.6, 0));
      surface.mesh.geometry.boundingSphere!.radius = 5;
    }
    const blink = time % 5.3;
    for (const detail of details) {
      detail.mesh.position.copy(deform(point.copy(detail.rest), -1, 0));
      // Follow the local deformed tangent plane, rather than leaving facial
      // details upright while the skin underneath bends.
      faceX.copy(deform(point.copy(detail.rest).addScaledVector(new THREE.Vector3(1, 0, 0), 0.01), -1, 0)).sub(detail.mesh.position).normalize();
      faceY.copy(deform(point.copy(detail.rest).addScaledVector(new THREE.Vector3(0, 1, 0), 0.01), -1, 0)).sub(detail.mesh.position).normalize();
      faceZAxis.crossVectors(faceX, faceY).normalize();
      faceY.crossVectors(faceZAxis, faceX).normalize();
      faceMatrix.makeBasis(faceX, faceY, faceZAxis);
      detail.mesh.quaternion.setFromRotationMatrix(faceMatrix);
      if (detail.eye) detail.mesh.scale.y = 0.16 * (blink > 4.9 && blink < 5.08 ? Math.max(0.1, Math.abs(blink - 4.99) / 0.09) : 1) * (1 - squash);
    }
  }
  function simulate(dt: number, time: number) {
    // Stiffness controls compliance; damping is a ratio of critical damping.
    const compliance = 1.6 - parameters.stiffness * 1.35;
    const dampingRatio = 0.24 + parameters.damping * 0.76;
    const bodySpring = 32 + parameters.stiffness * 64;
    const shapeSpring = 50 + parameters.stiffness * 100;
    const shapeDamping = 2 * Math.sqrt(shapeSpring) * dampingRatio;
    const limbLimit = 1.1 - parameters.stiffness * 0.8;
    if (grab?.drag) {
      goal.copy(grab.target).sub(grab.anchor);
      if (grab.hit.handle < 0) {
        if (movementConstraint) movementConstraint(goal);
        else { goal.x = clamp(goal.x, -2, 2); goal.y = clamp(goal.y, 0, 3); goal.z = clamp(goal.z, -2, 2); }
        velocity.addScaledVector(delta.copy(goal).sub(body), dt * bodySpring).multiplyScalar(Math.exp(-dt * 2 * Math.sqrt(bodySpring) * (0.72 + parameters.damping * 0.28)));
        velocity.y -= 9.8 * dt;
      } else velocity.addScaledVector(delta.copy(goal).sub(body).clampLength(0, 1.6), dt * 9);
    }
    if (!grab?.drag || grab.hit.handle >= 0) {
      velocity.y -= dt * 13;
      velocity.x -= body.x * dt * 6; velocity.z -= body.z * dt * 6;
      velocity.x *= Math.exp(-dt * 2 * Math.sqrt(6) * dampingRatio); velocity.z *= Math.exp(-dt * 2 * Math.sqrt(6) * dampingRatio);
    }
    body.addScaledVector(velocity, dt);
    if (body.y < 0) { const impact = -velocity.y; body.y = 0; velocity.y = impact > 0.6 ? impact * (0.42 - parameters.damping * 0.36) : 0; if (impact > 0.6) squashVelocity += impact * compliance; }
    if (movementConstraint) movementConstraint(body, velocity);
    else {
      body.x = clamp(body.x, -2.3, 2.3); body.z = clamp(body.z, -2.3, 2.3);
      if (body.y > 3) { body.y = 3; velocity.y = Math.min(0, velocity.y); }
    }
    fieldGoal.set(0, 0, 0);
    if (grab?.drag) fieldGoal.copy(grab.target).sub(grab.anchor).sub(body).multiplyScalar(compliance * (grab.hit.handle < 0 ? 1.6 : 0.7)).clampLength(0, 1.05 - parameters.stiffness * 0.75);
    pullVelocity.addScaledVector(delta.copy(fieldGoal).sub(pull), dt * shapeSpring);
    pullVelocity.multiplyScalar(Math.exp(-dt * shapeDamping));
    pull.addScaledVector(pullVelocity, dt).clampLength(0, 1.15 - parameters.stiffness * 0.8);
    fieldGoal.copy(velocity).multiplyScalar(-0.13 * compliance).clampLength(0, 0.58);
    const swaySpring = 16 + parameters.stiffness * 30;
    swayVelocity.addScaledVector(delta.copy(fieldGoal).sub(sway), dt * swaySpring);
    swayVelocity.multiplyScalar(Math.exp(-dt * 2 * Math.sqrt(swaySpring) * dampingRatio));
    sway.addScaledVector(swayVelocity, dt).clampLength(0, 0.65);
    deformationAmplitude = pull.length() + sway.length();
    const squashSpring = 80 + parameters.stiffness * 160;
    squashVelocity += (((pokeClock >= 0 && pokeClock < 0.15 ? 0.27 * compliance : 0) - squash) * squashSpring - squashVelocity * 2 * Math.sqrt(squashSpring) * dampingRatio) * dt;
    squash = clamp(squash + squashVelocity * dt, -0.18, 0.4);
    const pressSpring = 120 + parameters.stiffness * 120;
    pressVelocity += ((pressTarget * compliance - press) * pressSpring - pressVelocity * 2 * Math.sqrt(pressSpring) * (grab ? Math.max(0.85, dampingRatio) : dampingRatio)) * dt;
    press += pressVelocity * dt;
    for (let i = 0; i < limbs.length; i++) {
      const limb = limbs[i];
      goal.set(Math.sin(time * 1.5 + i) * 0.025, Math.sin(time * 1.9 + i * 0.6) * 0.028 + Math.max(0, -velocity.y) * 0.03, 0);
      if (grab?.drag && grab.hit.handle === i) goal.copy(grab.target).sub(grab.anchor).sub(body).clampLength(0, limbLimit);
      limb.velocity.addScaledVector(delta.copy(goal).sub(limb.offset), dt * shapeSpring);
      limb.velocity.multiplyScalar(Math.exp(-dt * shapeDamping));
      limb.offset.addScaledVector(limb.velocity, dt).clampLength(0, 1.15 - parameters.stiffness * 0.8);
    }
    if (pokeClock >= 0) { const previous = pokeClock; pokeClock += dt; if (previous < 0.15 && pokeClock >= 0.15) velocity.y = 3.6; if (pokeClock > 1.2) pokeClock = -1; }
  }
  function reset() {
    body.set(0, 0, 0); velocity.set(0, 0, 0); squash = 0; squashVelocity = 0; press = 0; pressVelocity = 0; pressTarget = 0; grab = null; pokeClock = -1;
    pull.set(0, 0, 0); pullVelocity.set(0, 0, 0); sway.set(0, 0, 0); swayVelocity.set(0, 0, 0); deformationAmplitude = 0;
    limbs.forEach(limb => { limb.offset.set(0, 0, 0); limb.velocity.set(0, 0, 0); }); render(lastTime); mechanicalShell.update();
  }
  const materialVariants = createMaterialVariants(object, [{ material, thickness: 1 }], [dark, blush]);
  const mechanicalShell = createMechanicalShell(surfaces.filter(surface => surface.mesh.material === material).map((surface, i) => ({ mesh: surface.mesh, axis: 'y' as const, bands: i === 0 ? 4 : 5, sectors: i === 0 ? 6 : 1, progress: surface.handle >= 0 ? surface.weights : undefined })));
  reset();
  return {
    object,
    deformAccessory(point, out) { deform(out.copy(point), -1, 0); },
    setMovementConstraint(constraint) { movementConstraint = constraint; constraint(body, velocity); },
    pick(raycaster) {
      const hit = mechanicalShell.pick(raycaster) ?? raycaster.intersectObjects(surfaces.map(surface => surface.mesh), false)[0];
      if (!hit) return null;
      const handle = surfaces.find(surface => surface.mesh === hit.object)!.handle;
      return { point: hit.point.clone(), normal: hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0), part: handle < 0 ? 'mantle' : `${handle < 8 ? 'arm' : 'tentacle'}-${handle + 1}`, handle };
    },
    beginGrab(hit) { const local = object.worldToLocal(hit.point.clone()); grab = { hit, target: local.clone(), anchor: local.clone().sub(body), drag: false }; pressPoint.copy(local).sub(body); pressNormal.copy(hit.normal).normalize(); pressTarget = 0.3; },
    moveGrab(worldPoint, isDrag) { if (!grab) return; grab.target.copy(worldPoint); object.worldToLocal(grab.target); if (!movementConstraint) grab.target.clamp(new THREE.Vector3(-4, 0.05, -4), new THREE.Vector3(4, 5, 4)); grab.target.y = Math.max(0.05, grab.target.y); grab.drag = isDrag; if (isDrag) pressTarget = 0; },
    endGrab() { grab = null; pressTarget = 0; },
    update(dt, time) { lastTime = time; const elapsed = clamp(dt, 0, 0.05); const steps = Math.max(1, Math.ceil(elapsed * 120)); for (let i = 0; i < steps; i++) simulate(elapsed / steps, time); render(time); mechanicalShell.update(); frames++; },
    poke() { grab = null; pressTarget = 0; pokeClock = 0; },
    reset,
    setParameters(next) {
      if (next.view !== undefined) { parameters.view = next.view; object.rotation.y = next.view === 'front' ? 0 : Math.PI / 2; object.updateMatrixWorld(true); }
      if (next.color) { parameters.color = next.color; material.color.set(next.color); }
      if (next.material !== undefined) parameters.material = next.material;
      if (next.color || next.material !== undefined) { materialVariants.set(parameters.material); mechanicalShell.set(parameters.material); }
      if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1);
      if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1);
    },
    diagnostics() { return { armCount: 8, tentacleCount: 2, bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab?.hit.part ?? 'none', finite: Number.isFinite(body.lengthSq() + squash + deformationAmplitude + limbs.reduce((sum, limb) => sum + limb.offset.lengthSq(), 0)), frames, deformationAmplitude, localPull: pull.length(), inertialSway: sway.length(), vertices: surfaces.reduce((sum, surface) => sum + surface.rest.length / 3, 0) }; },
    dispose() { mechanicalShell.dispose(); const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>(materialVariants.materials); object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach(value => materials.add(value)); } }); geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); object.clear(); },
  };
}
