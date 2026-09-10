import assert from 'node:assert/strict';
import { Mesh, Raycaster, Vector3 } from 'three/webgpu';
import type { Character } from '../src/characters/types';

// Compare actual rendered geometry under identical gestures, not solver constants.
for (const [file, factory, mechanical] of [
  ['octomochi', 'createOctoMochi', false], ['octomochi', 'createOctoMochi', true],
  ['cuttlemochi', 'createCuttleMochi'], ['squidmochi', 'createSquidMochi'],
  ['goldmochi', 'createGoldMochi'], ['clownmochi', 'createClownMochi'], ['whalemochi', 'createWhaleMochi'], ['sharkmochi', 'createSharkMochi'],
] as const) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const character: Character = characterModule[factory](mechanical);
  const label = `${file}${mechanical ? ' (mechanical)' : ''}`;
  const mesh = (character.object.getObjectByName('continuous-soft-body') ?? character.object.children.find(node => node instanceof Mesh)) as Mesh;
  const position = mesh.geometry.getAttribute('position');
  const rest = new Float32Array(position.array);
  character.object.updateMatrixWorld(true);
  const origin = character.object.localToWorld(['whalemochi', 'sharkmochi'].includes(file) ? new Vector3(-0.95, 6, 0.35) : new Vector3(0.12, 6, 0.1));
  const hit = character.pick(new Raycaster(origin, new Vector3(0, -1, 0)));
  assert.ok(hit && hit.handle < 0, `${label}: gesture must start on the body`);
  const localHit = character.object.worldToLocal(hit.point.clone());
  const delta = new Vector3(), mean = new Vector3(), body = new Vector3();
  let nearest = 0, distance = Infinity, frame = 0;
  for (let i = 0; i < position.count; i++) {
    const next = delta.fromArray(rest, i * 3).distanceToSquared(localHit);
    if (next < distance) { nearest = i; distance = next; }
  }
  const step = () => {
    character.update(1 / 60, frame++ / 60);
    const state = character.diagnostics();
    assert.equal(state.finite, true, `${label}: solver must remain finite`);
    assert.ok(Number(state.bodyHeight) >= 0, `${label}: body must stay above the floor`);
    if (state.maxStretch !== undefined) assert.ok(Number(state.maxStretch) <= 1.3801, `${label}: arm stretch must stay bounded`);
    if (state.minHeight !== undefined) assert.ok(Number(state.minHeight) >= -0.0001, `${label}: arms must stay above the floor`);
  };
  const begin = (stiffness: number, damping: number) => {
    character.reset(); frame = 0;
    character.setParameters({ stiffness, damping });
    character.beginGrab(hit);
    character.moveGrab(hit.point, false);
  };
  const dent = () => {
    const state = character.diagnostics();
    body.set(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ));
    return -delta.fromBufferAttribute(position, nearest).sub(body).sub(new Vector3().fromArray(rest, nearest * 3)).dot(hit.normal);
  };
  const deformation = () => {
    mean.set(0, 0, 0);
    for (let i = 0; i < position.count; i++) mean.add(delta.set(position.getX(i) - rest[i * 3], position.getY(i) - rest[i * 3 + 1], position.getZ(i) - rest[i * 3 + 2]));
    mean.divideScalar(position.count);
    let maximum = 0;
    for (let i = 0; i < position.count; i++) maximum = Math.max(maximum, delta.set(position.getX(i) - rest[i * 3], position.getY(i) - rest[i * 3 + 1], position.getZ(i) - rest[i * 3 + 2]).sub(mean).length());
    return maximum;
  };
  const holdDrag = () => {
    for (let i = 1; i <= 24; i++) {
      character.moveGrab(hit.point.clone().add(new Vector3(0.8, 1.5, 0).multiplyScalar(i / 24)), true);
      step();
    }
    for (let i = 0; i < 90; i++) step();
    assert.ok(Number(character.diagnostics().bodyHeight) > 0.5, `${label}: soft body must still follow a lift`);
  };

  const dents: number[] = [], pulls: number[] = [];
  for (const stiffness of [0, 1]) {
    begin(stiffness, 0.5);
    for (let i = 0; i < 60; i++) step();
    dents.push(dent());
    holdDrag();
    pulls.push(deformation());
  }
  assert.ok(dents[0] > dents[1] * 3 && dents[0] - dents[1] > 0.2, `${label}: soft press must visibly indent more (${dents.join(", ")})`);
  assert.ok(pulls[0] > pulls[1] * 1.3, `${label}: held stretch must retain a softness difference (${pulls.join(", ")})`);
  // Changing the slider while holding must update the shape immediately.
  begin(0, 0.5);
  for (let i = 0; i < 60; i++) step();
  character.setParameters({ stiffness: 1 });
  for (let i = 0; i < 60; i++) step();
  assert.ok(Math.abs(dent() - dents[1]) < 0.02, `${label}: held pressure must respond to parameter changes`);

  const residuals: number[] = [], crossings: number[] = [];
  for (const damping of [0, 1]) {
    // Change damping only at release, so initial shape and velocity match.
    begin(0.48, 0.5); holdDrag();
    character.endGrab(); character.setParameters({ damping });
    let residual = 0, sign = Math.sign(Number(character.diagnostics().bodyX)), count = 0;
    for (let i = 0; i < 360; i++) {
      step();
      const x = Number(character.diagnostics().bodyX);
      if (Math.abs(x) > 0.02 && Math.sign(x) !== sign) { sign = Math.sign(x); count++; }
      if (i >= 30 && i < 150 && i % 3 === 0) residual += deformation() ** 2;
    }
    residuals.push(residual); crossings.push(count);
    assert.ok(Number(character.diagnostics().bodyHeight) < 0.02, `${label}: both damping extremes must settle`);
    assert.ok(deformation() < 0.08, `${label}: released deformation must recover`);
  }
  assert.ok(residuals[1] < residuals[0] * 0.7, `${label}: high damping must reduce visible residual motion (${residuals.join(", ")})`);
  assert.ok(crossings[0] >= 2 && crossings[1] === 0, `${label}: low damping must sway through center while high damping settles (${crossings.join(", ")})`);
  console.log(`${label}: press ${dents.map(value => value.toFixed(3)).join(", ")}, stretch ${pulls.map(value => value.toFixed(3)).join(", ")}, residual ${residuals.map(value => value.toFixed(3)).join(", ")}, center crossings ${crossings.join(", ")}.`);
  character.dispose();
}
