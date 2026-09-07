import * as THREE from 'three/webgpu';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import type { Character, CharacterParameters, GrabHit } from './types';

const ARM_COUNT = 8;
const JOINTS = 8;
const CENTER_Y = 1.52;
const HEAD = new THREE.Vector3(1.49, 1.34, 1.29);
const UP = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp;
const smoothMin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};

interface Joint {
  rest: THREE.Vector3;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  rotation: THREE.Quaternion;
}
interface Skin {
  rest: Float32Array;
  arm: Uint8Array;
  joint: Uint8Array;
  along: Float32Array;
  head: Float32Array;
}
interface SurfaceDetail {
  mesh: THREE.Mesh;
  rest: THREE.Vector3;
  normal: THREE.Vector3;
  kind: 'eye' | 'cheek' | 'sucker' | 'mouth';
  arm: number;
  joint: number;
  along: number;
  head: number;
}

function makeArms(): Joint[][] {
  return Array.from({ length: ARM_COUNT }, (_, arm) => {
    // Offset the fan so two chubby arms frame the little face.
    const angle = arm * Math.PI * 2 / ARM_COUNT + Math.PI / 8;
    return Array.from({ length: JOINTS }, (_, j) => {
      const t = j / (JOINTS - 1);
      const radius = 0.62 + 2.1 * t - 0.3 * Math.pow(t, 5);
      const curl = 0.3 * Math.pow(t, 3);
      const y = 0.59 - 0.13 * Math.sin(t * Math.PI) + 0.16 * Math.pow(t, 7);
      const rest = new THREE.Vector3(Math.sin(angle + curl) * radius, y, Math.cos(angle + curl) * radius);
      return { rest, position: rest.clone(), velocity: new THREE.Vector3(), rotation: new THREE.Quaternion(), radius: 0.56 * (1 - t) + 0.23 * t };
    });
  });
}

function headDistance(x: number, y: number, z: number) {
  const px = x / HEAD.x, py = (y - CENTER_Y) / HEAD.y, pz = z / HEAD.z;
  const k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / HEAD.x, py / HEAD.y, pz / HEAD.z);
  return k0 * (k0 - 1) / Math.max(k1, 0.0001);
}

function armDistance(x: number, y: number, z: number, a: Joint, b: Joint) {
  const vx = b.rest.x - a.rest.x, vy = b.rest.y - a.rest.y, vz = b.rest.z - a.rest.z;
  const t = clamp(((x - a.rest.x) * vx + (y - a.rest.y) * vy + (z - a.rest.z) * vz) / (vx * vx + vy * vy + vz * vz), 0, 1);
  return Math.hypot(x - a.rest.x - vx * t, y - a.rest.y - vy * t, z - a.rest.z - vz * t) - THREE.MathUtils.lerp(a.radius, b.radius, t);
}

function buildSurface(arms: Joint[][], material: THREE.MeshPhysicalNodeMaterial) {
  // The head, mantle and eight arms are one smooth implicit surface. This field
  // is evaluated only at construction; animation skins its resulting mesh.
  const size = 64;
  const extent = 3.35;
  const verticalOffset = 1.2;
  const marching = new MarchingCubes(size, material, false, false, 45000);
  marching.isolation = 0;
  for (let z = 0; z < size; z++) {
    const pz = (z / size * 2 - 1) * extent;
    for (let y = 0; y < size; y++) {
      const py = (y / size * 2 - 1) * extent + verticalOffset;
      for (let x = 0; x < size; x++) {
        const px = (x / size * 2 - 1) * extent;
        let d = headDistance(px, py, pz);
        // Ignore distant tube segments before evaluating their exact distance.
        if (py < 1.55) {
          for (const arm of arms) {
            let ad = 10;
            for (let j = 0; j < JOINTS - 1; j++) ad = Math.min(ad, armDistance(px, py, pz, arm[j], arm[j + 1]));
            d = smoothMin(d, ad, 0.38);
          }
        }
        marching.field[x + y * size + z * size * size] = -d;
      }
    }
  }
  marching.update();
  const count = marching.geometry.drawRange.count;
  const positions = new Float32Array(count * 3);
  const source = marching.geometry.getAttribute('position');
  for (let i = 0; i < count; i++) {
    positions[i * 3] = source.getX(i) * extent;
    positions[i * 3 + 1] = source.getY(i) * extent + verticalOffset;
    positions[i * 3 + 2] = source.getZ(i) * extent;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  // Marching cubes already provides interpolated normals. Preserve their smooth
  // vertex sharing with a quantized index so computeVertexNormals stays smooth.
  const unique: number[] = [];
  const index: number[] = [];
  const lookup = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const key = `${Math.round(x * 100000)},${Math.round(y * 100000)},${Math.round(z * 100000)}`;
    let vertex = lookup.get(key);
    if (vertex === undefined) { vertex = unique.length / 3; lookup.set(key, vertex); unique.push(x, y, z); }
    index.push(vertex);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(unique, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  marching.geometry.dispose();
  return geometry;
}

function skinForPoint(point: THREE.Vector3, arms: Joint[][]) {
  let best = Infinity, armIndex = 0, jointIndex = 0, along = 0;
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    for (let j = 0; j < JOINTS - 1; j++) {
      const a = arms[arm][j], b = arms[arm][j + 1];
      const dx = b.rest.x - a.rest.x, dy = b.rest.y - a.rest.y, dz = b.rest.z - a.rest.z;
      const t = clamp(((point.x - a.rest.x) * dx + (point.y - a.rest.y) * dy + (point.z - a.rest.z) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
      const distance = Math.hypot(point.x - a.rest.x - dx * t, point.y - a.rest.y - dy * t, point.z - a.rest.z - dz * t) - THREE.MathUtils.lerp(a.radius, b.radius, t);
      if (distance < best) { best = distance; armIndex = arm; jointIndex = j; along = t; }
    }
  }
  const hd = headDistance(point.x, point.y, point.z);
  const head = THREE.MathUtils.smoothstep(best - hd, -0.25, 0.35);
  return { arm: armIndex, joint: jointIndex, along, head };
}

export function createOctoMochi(): Character {
  const object = new THREE.Group();
  object.name = 'OctoMochi';
  const arms = makeArms();
  const parameters: CharacterParameters = { color: '#c6a0df', stiffness: 0.48, damping: 0.42 };
  const material = new THREE.MeshPhysicalNodeMaterial({
    color: parameters.color, roughness: 0.27, metalness: 0,
    clearcoat: 0.55, clearcoatRoughness: 0.22,
    transmission: 0.08, thickness: 1.3, ior: 1.38,
    attenuationColor: new THREE.Color('#dcafe5'), attenuationDistance: 2.2,
    sheen: 0.3, sheenColor: new THREE.Color('#ffe7f4'), sheenRoughness: 0.65,
  });
  const geometry = buildSurface(arms, material);
  const surface = new THREE.Mesh(geometry, material);
  surface.name = 'continuous-soft-body';
  surface.castShadow = true;
  surface.receiveShadow = true;
  surface.frustumCulled = false;
  object.add(surface);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const skin: Skin = {
    rest: new Float32Array(positions.array), arm: new Uint8Array(positions.count), joint: new Uint8Array(positions.count),
    along: new Float32Array(positions.count), head: new Float32Array(positions.count),
  };
  const temp = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    const weights = skinForPoint(temp.fromBufferAttribute(positions, i), arms);
    skin.arm[i] = weights.arm; skin.joint[i] = weights.joint; skin.along[i] = weights.along; skin.head[i] = weights.head;
  }

  const eyeMaterial = new THREE.MeshPhysicalNodeMaterial({ color: '#241d28', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08 });
  const cheekMaterial = new THREE.MeshStandardNodeMaterial({ color: '#ec92b9', roughness: 0.8, transparent: true, opacity: 0.45, depthWrite: false });
  const suckerMaterial = new THREE.MeshPhysicalNodeMaterial({ color: '#f1c2da', roughness: 0.35, clearcoat: 0.4 });
  const details: SurfaceDetail[] = [];
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const suckerGeometry = new THREE.TorusGeometry(0.083, 0.032, 7, 14);
  const addDetail = (mesh: THREE.Mesh, rest: THREE.Vector3, normal: THREE.Vector3, kind: SurfaceDetail['kind']) => {
    details.push({ mesh, rest, normal, kind, ...skinForPoint(rest, arms) });
    object.add(mesh);
  };
  const headSurface = (x: number, y: number, offset = 0.03) => new THREE.Vector3(x, y, HEAD.z * Math.sqrt(Math.max(0, 1 - x * x / HEAD.x ** 2 - (y - CENTER_Y) ** 2 / HEAD.y ** 2)) + offset);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(sphere, eyeMaterial);
    eye.name = side < 0 ? 'left-eye' : 'right-eye';
    eye.scale.set(0.155, 0.19, 0.095);
    const point = headSurface(side * 0.47, 1.39, 0.041);
    addDetail(eye, point, new THREE.Vector3(side * 0.23, -0.08, 1).normalize(), 'eye');
    const cheek = new THREE.Mesh(sphere, cheekMaterial);
    cheek.scale.set(0.2, 0.086, 0.012);
    addDetail(cheek, headSurface(side * 0.72, 1.19, 0.027), new THREE.Vector3(side * 0.4, -0.13, 1).normalize(), 'cheek');
  }
  const mouthPoints = Array.from({ length: 17 }, (_, i) => {
    const angle = Math.PI + i / 16 * Math.PI;
    return new THREE.Vector3(Math.cos(angle) * 0.17, Math.sin(angle) * 0.1, 0);
  });
  const mouthGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 24, 0.024, 8, false);
  const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial);
  addDetail(mouth, headSurface(0, 1.26, 0.045), new THREE.Vector3(0, -0.1, 1).normalize(), 'mouth');
  const surprisedMouth = new THREE.Mesh(new THREE.TorusGeometry(0.067, 0.022, 8, 24), eyeMaterial);
  surprisedMouth.visible = false;
  object.add(surprisedMouth);
  for (let a = 0; a < ARM_COUNT; a++) {
    for (let j = 3; j < JOINTS; j++) {
      const joint = arms[a][j];
      const tangent = joint.rest.clone().sub(arms[a][j - 1].rest).normalize();
      // Two rows sit on the underside. The outside row is visible around the
      // soft edge; lifted and curled arms reveal both rows naturally.
      const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      for (const sign of [-1, 1]) {
        const normal = new THREE.Vector3(side.x * sign * 0.78, -0.62, side.z * sign * 0.78).normalize();
        const point = joint.rest.clone().addScaledVector(normal, joint.radius * 0.96);
        const sucker = new THREE.Mesh(suckerGeometry, suckerMaterial);
        sucker.scale.setScalar(1.1 - j * 0.055);
        addDetail(sucker, point, normal, 'sucker');
      }
    }
  }

  const body = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  let squash = 0, squashVelocity = 0, press = 0, pressTarget = 0;
  let grab: { hit: GrabHit; target: THREE.Vector3; offset: THREE.Vector3; drag: boolean } | null = null;
  let pokeClock = -1, recovery = 1, frame = 0, lastTime = 0;
  const pressPoint = new THREE.Vector3();
  const pressNormal = new THREE.Vector3(0, 1, 0);
  let surprise = 0;
  const delta = new THREE.Vector3();
  const goal = new THREE.Vector3();
  const deformed = new THREE.Vector3();
  const sourcePoint = new THREE.Vector3();
  const skinRotation = new THREE.Quaternion();
  const skinOffset = new THREE.Vector3();
  const boneRestDirection = new THREE.Vector3();
  const boneDirection = new THREE.Vector3();
  const detailNormal = new THREE.Vector3();
  const FRONT = new THREE.Vector3(0, 0, 1);

  function deform(p: THREE.Vector3, arm: number, j: number, along: number, head: number, out: THREE.Vector3) {
    const a = arms[arm][j], b = arms[arm][j + 1];
    skinRotation.slerpQuaternions(a.rotation, b.rotation, along);
    skinOffset.set(
      p.x - THREE.MathUtils.lerp(a.rest.x, b.rest.x, along),
      p.y - THREE.MathUtils.lerp(a.rest.y, b.rest.y, along),
      p.z - THREE.MathUtils.lerp(a.rest.z, b.rest.z, along),
    ).applyQuaternion(skinRotation);
    const dx = skinOffset.x + THREE.MathUtils.lerp(a.position.x, b.position.x, along) - p.x;
    const dy = skinOffset.y + THREE.MathUtils.lerp(a.position.y, b.position.y, along) - p.y;
    const dz = skinOffset.z + THREE.MathUtils.lerp(a.position.z, b.position.z, along) - p.z;
    const radial = 1 + squash * 0.38;
    out.set(
      p.x + (dx * (1 - head) + (body.x + p.x * (radial - 1)) * head),
      p.y + (dy * (1 - head) + (body.y - (p.y - 0.36) * squash) * head),
      p.z + (dz * (1 - head) + (body.z + p.z * (radial - 1)) * head),
    );
    if (press > 0.001) {
      const distance = p.distanceToSquared(pressPoint);
      const dent = press * Math.exp(-distance / 0.4) * head;
      out.addScaledVector(pressNormal, -dent);
    }
    out.y = Math.max(0.032, out.y);
    return out;
  }

  function simulate(dt: number, time: number) {
    const stiffness = 26 + parameters.stiffness * 64;
    const damping = 2.8 + parameters.damping * 10;
    if (grab?.drag && grab.hit.handle < 0) {
      goal.copy(grab.target).sub(grab.offset);
      goal.x = clamp(goal.x, -2.6, 2.6); goal.z = clamp(goal.z, -2.6, 2.6); goal.y = clamp(goal.y, 0, 3.5);
      velocity.addScaledVector(delta.copy(goal).sub(body), dt * 100);
      velocity.multiplyScalar(Math.exp(-dt * 12));
    } else {
      velocity.y -= 13 * dt;
      velocity.x *= Math.exp(-dt * (body.y < 0.05 ? 5 : 0.6));
      velocity.z *= Math.exp(-dt * (body.y < 0.05 ? 5 : 0.6));
      // Settle near the center, without snapping out of a throw.
      velocity.x -= body.x * dt * 2;
      velocity.z -= body.z * dt * 2;
    }
    body.addScaledVector(velocity, dt);
    if (body.y < 0) {
      const impact = Math.max(0, -velocity.y);
      body.y = 0;
      if (impact > 0.6) { velocity.y = impact * (0.24 - parameters.damping * 0.1); squashVelocity += impact * 1.1; }
      else velocity.y = 0;
    }
    for (const axis of ['x', 'z'] as const) {
      if (Math.abs(body[axis]) > 2.6) { body[axis] = clamp(body[axis], -2.6, 2.6); velocity[axis] *= 0.1; }
    }
    if (body.y > 3.5) { body.y = 3.5; velocity.y = Math.min(velocity.y, 0); }
    if (grab?.drag && grab.hit.handle >= 0) {
      const a = Math.floor(grab.hit.handle / JOINTS), j = grab.hit.handle % JOINTS;
      delta.copy(grab.target).sub(grab.offset).sub(arms[a][j].position);
      // A tug transfers some impulse to the mantle and the other seven arms.
      delta.clampLength(0, 2.5);
      velocity.addScaledVector(delta, dt * 11);
    }
    const desiredSquash = pokeClock >= 0 && pokeClock < 0.16 ? 0.28 : 0;
    squashVelocity += ((desiredSquash - squash) * 160 - squashVelocity * (8 + parameters.damping * 8)) * dt;
    squash += squashVelocity * dt;
    squash = clamp(squash, -0.2, 0.42);
    press += (pressTarget - press) * Math.min(1, dt * 14);
    for (let a = 0; a < ARM_COUNT; a++) {
      const arm = arms[a];
      for (let j = 0; j < JOINTS; j++) {
        const joint = arm[j];
        if (j === 0) { joint.position.copy(joint.rest).add(body); joint.velocity.copy(velocity); continue; }
        const t = j / (JOINTS - 1);
        const curl = !grab && body.y < 0.08 ? Math.sin(time * 1.4 + a * 0.72) * 0.035 * t ** 4 : 0;
        const contraction = pokeClock >= 0 ? Math.sin(Math.min(1, pokeClock / 0.5) * Math.PI) * 0.32 * t : 0;
        goal.copy(joint.rest).multiplyScalar(1 - contraction).add(body);
        goal.y += curl + contraction * 2.2;
        // Natural rest angles plus sequential recovery preserve each animal's
        // structure, while neighbor constraints handle inextensibility.
        const follow = stiffness * (0.95 - 0.62 * t) * (0.8 + Math.min(recovery, 1) * 0.2);
        joint.velocity.addScaledVector(delta.copy(goal).sub(joint.position), follow * dt);
        joint.velocity.y -= (body.y > 0.05 ? 8 * t : 0) * dt;
        joint.velocity.multiplyScalar(Math.exp(-damping * dt));
        joint.position.addScaledVector(joint.velocity, dt);
      }
      for (let iteration = 0; iteration < 5; iteration++) {
        for (let j = 1; j < JOINTS; j++) {
          const prev = arm[j - 1], current = arm[j];
          delta.copy(current.position).sub(prev.position);
          const length = delta.length();
          const restLength = current.rest.distanceTo(prev.rest);
          const maxLength = restLength * 1.38;
          if (length > maxLength) {
            delta.multiplyScalar((length - maxLength) / length);
            current.position.addScaledVector(delta, -0.64);
            if (j > 1) prev.position.addScaledVector(delta, 0.36);
          }
          current.position.y = Math.max(current.radius * 0.88 + 0.025, current.position.y);
        }
        if (grab?.drag && grab.hit.handle >= 0 && Math.floor(grab.hit.handle / JOINTS) === a) {
          const j = grab.hit.handle % JOINTS;
          goal.copy(grab.target).sub(grab.offset);
          delta.copy(goal).sub(arm[0].position);
          const reach = arms[a][j].rest.distanceTo(arm[0].rest) * 1.38;
          if (delta.length() > reach) goal.copy(arm[0].position).add(delta.setLength(reach));
          goal.y = Math.max(arm[j].radius, goal.y);
          arm[j].position.lerp(goal, 0.56);
          arm[j].velocity.multiplyScalar(0.5);
        }
      }
      // Final forward projection guarantees the per-segment stretch bound even
      // for pointer positions far outside the playable region.
      for (let j = 1; j < JOINTS; j++) {
        const prev = arm[j - 1], current = arm[j];
        delta.copy(current.position).sub(prev.position);
        const maxLength = current.rest.distanceTo(prev.rest) * 1.38;
        if (delta.length() > maxLength) current.position.copy(prev.position).add(delta.setLength(maxLength));
        current.position.y = Math.max(current.radius * 0.88 + 0.025, current.position.y);
      }
    }
    if (pokeClock >= 0) {
      const previous = pokeClock;
      pokeClock += dt;
      if (previous < 0.15 && pokeClock >= 0.15) velocity.y = 3.7;
      if (pokeClock > 1.3) pokeClock = -1;
    }
    recovery += dt;
    surprise += (((grab?.drag || (pokeClock > 0.12 && pokeClock < 0.5)) ? 1 : 0) - surprise) * Math.min(1, dt * 12);
  }

  function updateGeometry(time: number) {
    for (const arm of arms) for (let j = 0; j < JOINTS; j++) {
      const before = arm[Math.max(0, j - 1)], after = arm[Math.min(JOINTS - 1, j + 1)];
      boneRestDirection.copy(after.rest).sub(before.rest).normalize();
      boneDirection.copy(after.position).sub(before.position).normalize();
      arm[j].rotation.setFromUnitVectors(boneRestDirection, boneDirection);
    }
    for (let i = 0; i < positions.count; i++) {
      sourcePoint.fromArray(skin.rest, i * 3);
      deform(sourcePoint, skin.arm[i], skin.joint[i], skin.along[i], skin.head[i], deformed);
      positions.setXYZ(i, deformed.x, deformed.y, deformed.z);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    // Broad bounds allow accurate ray picking throughout a pull without scanning
    // the mesh a second time every frame.
    geometry.boundingSphere!.center.copy(body).add(new THREE.Vector3(0, 1.5, 0));
    geometry.boundingSphere!.radius = 5;
    const blinkPhase = time % 5.7;
    const blink = !grab && blinkPhase > 4.9 && blinkPhase < 5.08 ? Math.abs((blinkPhase - 4.99) / 0.09) : 1;
    for (const detail of details) {
      deform(detail.rest, detail.arm, detail.joint, detail.along, detail.head, detail.mesh.position);
      skinRotation.slerpQuaternions(arms[detail.arm][detail.joint].rotation, arms[detail.arm][detail.joint + 1].rotation, detail.along);
      detailNormal.copy(detail.normal).applyQuaternion(skinRotation).lerp(detail.normal, detail.head).normalize();
      detail.mesh.quaternion.setFromUnitVectors(FRONT, detailNormal);
      if (detail.kind === 'eye') detail.mesh.scale.set(0.155 * (1 + squash * 0.25), 0.19 * Math.max(0.08, blink) * (1 - squash) * (1 + surprise * 0.15), 0.095);
      if (detail.kind === 'mouth') {
        detail.mesh.visible = surprise < 0.45;
        detail.mesh.scale.set(1 + squash * 0.4, 1 - squash, 1);
        surprisedMouth.position.copy(detail.mesh.position);
        surprisedMouth.quaternion.copy(detail.mesh.quaternion);
        surprisedMouth.visible = surprise >= 0.45;
        surprisedMouth.scale.set(1, 1.2 + surprise * 0.35, 1);
      }
    }
  }

  function reset() {
    body.set(0, 0, 0); velocity.set(0, 0, 0); squash = 0; squashVelocity = 0;
    press = 0; pressTarget = 0; grab = null; pokeClock = -1; recovery = 1; surprise = 0;
    for (const arm of arms) for (const joint of arm) { joint.position.copy(joint.rest); joint.velocity.set(0, 0, 0); }
    updateGeometry(lastTime);
  }
  reset();
  return {
    object,
    pick(raycaster) {
      const result = raycaster.intersectObject(surface, false)[0];
      if (!result) return null;
      const point = object.worldToLocal(result.point.clone());
      const normal = result.face?.normal.clone() ?? UP.clone();
      let handle = -1;
      if (result.face) {
        // Identify the material part from the picked triangle's bind weights,
        // not its height: a lifted arm is still an arm even above the head.
        let nearestVertex = result.face.a;
        let nearestDistance = Infinity;
        for (const vertex of [result.face.a, result.face.b, result.face.c]) {
          temp.fromBufferAttribute(positions, vertex);
          const distance = temp.distanceToSquared(point);
          if (distance < nearestDistance) { nearestDistance = distance; nearestVertex = vertex; }
        }
        if (skin.head[nearestVertex] < 0.65) {
          const j = clamp(Math.round(skin.joint[nearestVertex] + skin.along[nearestVertex]), 2, JOINTS - 1);
          handle = skin.arm[nearestVertex] * JOINTS + j;
        }
      }
      return { point: result.point.clone(), normal, part: handle < 0 ? 'head' : `arm-${Math.floor(handle / JOINTS) + 1}`, handle };
    },
    beginGrab(hit) {
      const local = object.worldToLocal(hit.point.clone());
      const anchor = hit.handle < 0 ? body : arms[Math.floor(hit.handle / JOINTS)][hit.handle % JOINTS].position;
      grab = { hit, target: local.clone(), offset: local.clone().sub(anchor), drag: false };
      pressPoint.copy(local).sub(body); pressNormal.copy(hit.normal).normalize();
      pressTarget = hit.handle < 0 ? 0.4 : 0.1;
    },
    moveGrab(worldPoint, isDrag) {
      if (!grab) return;
      grab.target.copy(worldPoint); object.worldToLocal(grab.target);
      grab.target.x = clamp(grab.target.x, -4.5, 4.5);
      grab.target.z = clamp(grab.target.z, -4.5, 4.5);
      grab.target.y = clamp(grab.target.y, 0.08, 5.5);
      grab.drag = isDrag;
      if (isDrag) pressTarget = grab.hit.handle < 0 ? 0.16 : 0;
    },
    endGrab() { grab = null; pressTarget = 0; recovery = 0; },
    update(dt, time) {
      lastTime = time;
      const elapsed = Math.min(Math.max(dt, 0), 1 / 20);
      const steps = Math.max(1, Math.ceil(elapsed / (1 / 120)));
      for (let i = 0; i < steps; i++) simulate(elapsed / steps, time);
      updateGeometry(time); frame++;
    },
    poke() { if (grab) grab = null; pressTarget = 0; pokeClock = 0; squashVelocity -= 0.3; },
    reset,
    setParameters(next) {
      if (next.color) { parameters.color = next.color; material.color.set(next.color); material.attenuationColor.set(next.color).lerp(new THREE.Color('white'), 0.45); }
      if (next.stiffness !== undefined) parameters.stiffness = clamp(next.stiffness, 0, 1);
      if (next.damping !== undefined) parameters.damping = clamp(next.damping, 0, 1);
    },
    diagnostics() {
      let maxStretch = 0, minHeight = Infinity;
      for (const arm of arms) for (let j = 1; j < JOINTS; j++) {
        maxStretch = Math.max(maxStretch, arm[j].position.distanceTo(arm[j - 1].position) / arm[j].rest.distanceTo(arm[j - 1].rest));
        minHeight = Math.min(minHeight, arm[j].position.y - arm[j].radius * 0.88);
      }
      return { armCount: ARM_COUNT, vertices: positions.count, triangles: geometry.index!.count / 3, bodyX: body.x, bodyZ: body.z, bodyHeight: body.y, maxStretch, minHeight, squash, pressed: press, dragging: Boolean(grab?.drag), grabbedPart: grab?.hit.part ?? 'none', finite: Number.isFinite(body.lengthSq() + maxStretch), frames: frame };
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      object.traverse(child => { if (child instanceof THREE.Mesh) { geometries.add(child.geometry); const m = child.material; if (Array.isArray(m)) m.forEach(value => materials.add(value)); else materials.add(m); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      object.clear();
    },
  };
}
