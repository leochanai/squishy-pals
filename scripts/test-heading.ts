import assert from 'node:assert/strict';
import { Mesh, Raycaster, Vector3 } from 'three/webgpu';
import type { Character, GrabHit } from '../src/characters/types';

for (const [file, factory, headOrigin, tailOrigin, finOrigin, center] of [
  ['whalemochi', 'createWhaleMochi', [-0.95, 6, 0.35], [2.2, 6, 0.65], [0.2, 6, 1.12], [0, 1.24, 0]],
  ['sharkmochi', 'createSharkMochi', [-0.95, 6, 0.35], [1.95, 6, 0], [0.2, 6, 1.12], [0, 1.24, 0]],
  ['clownmochi', 'createClownMochi', [0.25, 6, 1.25], [0, 6, -1.9], [0.98, 6, 0.33], [0, 1.28, 0.2]],
  ['goldmochi', 'createGoldMochi', [0, 6, 0.9], [0.2, 6, -1.9], [1.23, 6, -0.03], [0, 1.28, 0.2]],
] as const) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const character: Character = characterModule[factory]();
  const mesh = character.object.children.find(node => node instanceof Mesh) as Mesh;
  const position = mesh.geometry.getAttribute('position');
  character.setParameters({ view: 'front' });
  const defaultHeading = character.object.rotation.y;
  let frame = 0;
  const step = (count: number) => {
    for (let i = 0; i < count; i++) {
      const previousHeading = character.object.rotation.y;
      character.update(1 / 60, frame++ / 60);
      const state = character.diagnostics();
      assert.equal(state.finite, true);
      assert.ok(Number(state.bodyHeight) >= 0);
      assert.ok(Math.abs(character.object.rotation.y - previousHeading) < 0.4, 'turn must be smooth, not an instant flip');
    }
  };
  const pick = (origin: readonly number[]) => {
    const state = character.diagnostics();
    const local = new Vector3().fromArray(origin).add(new Vector3(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ)));
    character.object.updateMatrixWorld(true);
    const hit = character.pick(new Raycaster(character.object.localToWorld(local), new Vector3(0, -1, 0)));
    assert.ok(hit, `${file}: test gesture must hit a visible part`);
    return hit;
  };
  const drag = (hit: GrabHit, x: number) => {
    for (let i = 1; i <= 30; i++) {
      character.moveGrab(hit.point.clone().add(new Vector3(x * i / 30, 0.8 * i / 30, 0)), true);
      step(1);
    }
    // Turning continues smoothly even when the pointer stops moving.
    step(60);
  };
  const head = pick(headOrigin);
  assert.equal(head.handle, -1);
  const localHead = character.object.worldToLocal(head.point.clone());
  const vertex = new Vector3();
  let nearest = 0, distance = Infinity;
  for (let i = 0; i < position.count; i++) {
    const next = vertex.fromBufferAttribute(position, i).distanceToSquared(localHead);
    if (next < distance) { distance = next; nearest = i; }
  }
  const headDirection = () => {
    const state = character.diagnostics();
    const bodyCenter = character.object.localToWorld(new Vector3().fromArray(center).add(new Vector3(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ))));
    return character.object.localToWorld(vertex.fromBufferAttribute(position, nearest)).sub(bodyCenter).x;
  };
  character.beginGrab(head);
  character.moveGrab(head.point.clone().add(new Vector3(0.04, 0, 0)), false);
  step(30);
  assert.equal(character.object.rotation.y, defaultHeading, 'clicks must preserve the heading');
  character.moveGrab(head.point.clone().add(new Vector3(0.04, 0.6, 0)), true);
  step(30);
  assert.equal(character.object.rotation.y, defaultHeading, 'vertical pulls and small horizontal jitter must not turn');
  drag(head, 1.2);
  assert.ok(headDirection() > 0.25, `${file}: the rendered head must face right after a rightward head pull`);
  // Reverse the same grab without releasing or repicking the head.
  drag(head, -1.2);
  assert.ok(headDirection() < -0.25, `${file}: reversing the pull must turn the head left`);
  drag(head, 0);
  assert.ok(Math.abs(character.object.rotation.y - defaultHeading) < 0.02, `${file}: pulling back to the gesture origin restores front`);
  drag(head, -1.2);
  character.endGrab();
  const releasedHeading = character.object.rotation.y;
  step(180);
  assert.equal(character.object.rotation.y, releasedHeading, 'release must preserve the new heading');

  for (const origin of [tailOrigin, finOrigin]) {
    // Grab after a turn as well: hit classification must survive the new pose.
    const hit = pick(origin);
    assert.ok(hit.handle >= 0, `${file}: tail and fin must remain independently pickable`);
    character.beginGrab(hit); drag(hit, 1.4); character.endGrab(); step(60);
    assert.equal(character.object.rotation.y, releasedHeading, 'tail and fin pulls must not steer');
  }
  character.reset();
  assert.equal(character.object.rotation.y, defaultHeading, 'reset must restore the original pose');
  assert.equal(character.diagnostics().bodyX, 0);
  assert.equal(character.diagnostics().bodyZ, 0);
  assert.equal(character.diagnostics().dragging, false);
  console.log(`${file}: head steers both ways; tail, fin, click and vertical pull preserve heading; smooth turn, release and reset passed.`);
  character.dispose();
}

// The cephalopods must expose their side through ordinary body gestures too.
// Exercise the registered octopus wrapper so its two material skins share yaw.
const { createAccessories } = await import('../src/core/accessories.ts');
const { frameCharacter, createMovementConstraint } = await import('../src/core/stage.ts');
const { Box3, PerspectiveCamera } = await import('three/webgpu');
for (const [id, file, factory, headOrigin, limbOrigins] of [
  ['octomochi', 'octopus', 'createOctopus', [0, 6, 0.8], [[1.1, 6, 1.9]]],
  ['cuttlemochi', 'cuttlemochi', 'createCuttleMochi', [0, 6, 0], [[0.17, 6, 1.85], [1.4, 6, -0.4]]],
  ['squidmochi', 'squidmochi', 'createSquidMochi', [0.1, 6, 0.1], [[0.8, 6, 1.7], [0.85, 6, 0]]],
] as const) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const character: Character = characterModule[factory]();
  const bounds = new Box3().setFromObject(character.object, true);
  const restCorners: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) restCorners.push(new Vector3(x, y, z));
  const camera = new PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 3.8, 10.8); camera.lookAt(0, 1.3, 0); camera.updateMatrixWorld(true);
  frameCharacter(camera, bounds, 390, 591, 253.2);
  const constrain = createMovementConstraint(camera, character.object, bounds, 390, 591);
  character.setMovementConstraint(constrain);
  const accessories = createAccessories(character, id); accessories.set(['glasses', 'headphones']);
  let frame = 0;
  const step = (count: number) => {
    for (let i = 0; i < count; i++) {
      const previous = character.object.rotation.y;
      character.update(1 / 60, frame++ / 60); accessories.update();
      const state = character.diagnostics();
      assert.equal(state.finite, true, `${id}: rotating must keep the solver finite`);
      assert.ok(Math.abs(character.object.rotation.y - previous) < 0.4, `${id}: turn must be smooth`);
      const body = new Vector3(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ));
      for (const corner of restCorners) {
        const projected = corner.clone().add(body).applyMatrix4(character.object.matrixWorld).project(camera);
        assert.ok(Math.abs(projected.x) <= 1 - 24 / 390 + 0.001, `${id}: turned silhouette must stay horizontally in the stage`);
        assert.ok(projected.y <= 1 - 32 / 591 + 0.001 && projected.y >= -1 + 136 / 591 - 0.001, `${id}: turned silhouette must stay above the label and below the top`);
      }
    }
  };
  const pick = (origin: readonly number[]) => {
    character.object.updateMatrixWorld(true);
    const state = character.diagnostics();
    const local = new Vector3().fromArray(origin).add(new Vector3(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ)));
    const hit = character.pick(new Raycaster(character.object.localToWorld(local), new Vector3(0, -1, 0)));
    assert.ok(hit, `${id}: regression gesture must hit rendered geometry`);
    return hit;
  };
  const drag = (hit: GrabHit, x: number, y = 0.5) => {
    character.moveGrab(hit.point.clone().add(new Vector3(x, y, 0)), true); step(60);
  };
  for (const material of ['original', 'jelly', 'mechanical'] as const) {
    character.reset(); character.setParameters({ material, view: 'front' });
    const hit = pick(headOrigin);
    assert.ok(hit.handle < 0 && hit.part !== 'fin', `${id}: head test must hit the mantle/head`);
    character.beginGrab(hit);
    character.moveGrab(hit.point.clone().add(new Vector3(0.04, 0, 0)), false); step(20);
    assert.equal(character.object.rotation.y, 0, `${id}: clicks must not steer`);
    drag(hit, 0.04, 0.7);
    assert.equal(character.object.rotation.y, 0, `${id}: vertical drag with jitter must not steer`);
    drag(hit, 1.2);
    assert.ok(character.object.rotation.y > 1.3, `${id}/${material}: body drag must expose the right side`);
    // The visible model, not a hidden skin, must carry the new transform.
    const facing = character.object.localToWorld(new Vector3(0, 0, 1)).sub(character.object.getWorldPosition(new Vector3()));
    assert.ok(facing.x > 0.9, `${id}: the rendered local front must turn right`);
    drag(hit, -1.2);
    assert.ok(character.object.rotation.y < -1.3, `${id}/${material}: the same grab must turn left`);
    drag(hit, 0);
    assert.ok(Math.abs(character.object.rotation.y) < 0.02, `${id}: returning the pointer restores the grab's original heading`);
    drag(hit, 1.2);
    const heading = character.object.rotation.y;
    character.setParameters({ material: material === 'mechanical' ? 'original' : 'mechanical' });
    assert.equal(character.object.rotation.y, heading, `${id}: material switch during a grab must preserve heading`);
    step(15);
    assert.ok(character.object.getObjectByName('glasses')!.visible, `${id}: accessories stay attached and visible`);
    character.endGrab(); const released = character.object.rotation.y; step(120);
    assert.equal(character.object.rotation.y, released, `${id}: release preserves the chosen direction`);
    for (const origin of limbOrigins) {
      const limb = pick(origin);
      assert.ok(limb.handle >= 0 || limb.part === 'fin', `${id}: appendage test must hit an arm or fin`);
      character.beginGrab(limb); drag(limb, -1.4); character.endGrab(); step(20);
      assert.equal(character.object.rotation.y, released, `${id}: arm/fin drags must not steer`);
    }
  }
  character.reset();
  assert.equal(character.object.rotation.y, 0, `${id}: reset restores front`);
  assert.equal(character.diagnostics().dragging, false);
  accessories.dispose(); character.dispose();
  console.log(`${id}: body heading, gesture reversal, arm/fin exclusions, all materials, accessories and rotated stage constraint passed.`);
}
