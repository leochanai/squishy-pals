import assert from 'node:assert/strict';
import { Mesh, Raycaster, Vector3 } from 'three/webgpu';
import type { Character, GrabHit } from '../src/characters/types';

for (const [file, factory, headOrigin, tailOrigin, finOrigin, center] of [
  ['whalemochi', 'createWhaleMochi', [-0.95, 6, 0.35], [2.2, 6, 0.65], [0.2, 6, 1.12], [0, 1.24, 0]],
  ['sharkmochi', 'createSharkMochi', [-0.95, 6, 0.35], [1.95, 6, 0], [0.2, 6, 1.12], [0, 1.24, 0]],
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
