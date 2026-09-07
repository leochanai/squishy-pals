import assert from 'node:assert/strict';
import { Raycaster, Vector3 } from 'three/webgpu';
// A URL keeps Node's native TypeScript runner compatible with the app's
// bundler-resolution tsconfig (which intentionally uses extensionless imports).
const { createOctoMochi } = await import(new URL('../src/characters/octomochi.ts', import.meta.url).href) as typeof import('../src/characters/octomochi');

// Runs without a renderer: exercise the actual character solver and deformation
// buffers, including pointer targets well beyond the visible canvas.
const character = createOctoMochi();
let frame = 0;
let worstStretch = 0;
const step = (count: number) => {
  for (let i = 0; i < count; i++) {
    character.update(1 / 60, frame++ / 60);
    const state = character.diagnostics();
    assert.equal(state.finite, true, 'solver must never produce NaN or Infinity');
    assert.ok(Number(state.maxStretch) <= 1.3801, 'each segment must obey the elastic limit');
    assert.ok(Number(state.minHeight) >= -0.0001, 'arms must stay above the table');
    assert.ok(Number(state.bodyHeight) >= 0 && Number(state.bodyHeight) <= 3.5001, 'body must remain inside its vertical bounds');
    worstStretch = Math.max(worstStretch, Number(state.maxStretch));
  }
};
assert.equal(character.diagnostics().armCount, 8);
character.object.updateMatrixWorld(true);
for (let arm = 0; arm < 8; arm++) {
  const angle = arm * Math.PI / 4 + Math.PI / 8 + 0.3;
  const ray = new Raycaster(new Vector3(Math.sin(angle) * 2.42, 4, Math.cos(angle) * 2.42), new Vector3(0, -1, 0));
  assert.equal(character.pick(ray)?.part, `arm-${arm + 1}`, 'each visible arm tip must be independently pickable');
}

// Both parameter extremes, all eight independently addressable arm tips.
for (let arm = 0; arm < 8; arm++) {
  character.reset();
  character.setParameters({ stiffness: arm % 2, damping: (arm + 1) % 2 });
  const angle = arm * Math.PI / 4 + Math.PI / 8 + 0.3;
  character.beginGrab({
    point: new Vector3(Math.sin(angle) * 2.42, 0.75, Math.cos(angle) * 2.42),
    normal: new Vector3(0, 1, 0), part: `arm-${arm + 1}`, handle: arm * 8 + 7,
  });
  character.moveGrab(new Vector3(12, 9, 14), true);
  step(120);
  assert.equal(character.diagnostics().grabbedPart, `arm-${arm + 1}`);
  character.endGrab();
  step(360);
  assert.ok(Number(character.diagnostics().bodyHeight) < 0.015, 'released body must settle back onto the table');
}

character.reset();
character.setParameters({ stiffness: 0.48, damping: 0.42 });
character.beginGrab({ point: new Vector3(0, 2.7, 0.45), normal: new Vector3(0, 1, 0), part: 'head', handle: -1 });
step(40);
assert.ok(Number(character.diagnostics().pressed) > 0.35, 'holding the head must make a local indentation');
character.moveGrab(new Vector3(1, 8, 0.45), true);
step(120);
assert.ok(Number(character.diagnostics().bodyHeight) > 2, 'head drag must lift the whole body');
character.endGrab();
let impactSquash = 0;
for (let i = 0; i < 240; i++) { step(1); impactSquash = Math.max(impactSquash, Number(character.diagnostics().squash)); }
assert.ok(impactSquash > 0.2, 'landing must visibly squash the head');
step(240);
assert.ok(Math.abs(Number(character.diagnostics().squash)) < 0.005, 'landing oscillation must decay');

character.reset();
character.poke();
let jumpHeight = 0;
for (let i = 0; i < 240; i++) { step(1); jumpHeight = Math.max(jumpHeight, Number(character.diagnostics().bodyHeight)); }
assert.ok(jumpHeight > 0.3 && jumpHeight < 1, 'poke must produce a small, bounded hop');
assert.ok(Number(character.diagnostics().bodyHeight) < 0.015, 'poke must settle');
assert.equal(character.diagnostics().dragging, false);
character.reset();
assert.equal(character.diagnostics().bodyX, 0);
assert.equal(character.diagnostics().bodyZ, 0);
assert.equal(character.diagnostics().pressed, 0);
character.dispose();
console.log(`Physics passed: ${frame} frames, 8 independent arms, maximum segment stretch ${worstStretch.toFixed(4)}, landing squash ${impactSquash.toFixed(3)}, poke height ${jumpHeight.toFixed(3)}.`);
