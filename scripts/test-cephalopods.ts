import assert from 'node:assert/strict';
import { Raycaster, Vector3, Mesh } from 'three/webgpu';
import type { Character } from '../src/characters/types';

const factories: Array<() => Character> = [];
for (const [file, factory] of [['cuttlemochi', 'createCuttleMochi'], ['squidmochi', 'createSquidMochi'], ['goldmochi', 'createGoldMochi'], ['whalemochi', 'createWhaleMochi'], ['sharkmochi', 'createSharkMochi']]) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  factories.push(characterModule[factory]);
}

for (const create of factories) {
  if (process.argv[2] && create.name !== process.argv[2]) continue;
  const character = create();
  const mantle = character.object.children.find(node => node instanceof Mesh) as Mesh;
  const rest = new Float32Array(mantle.geometry.getAttribute('position').array);
  if (['WhaleMochi', 'SharkMochi'].includes(character.object.name)) {
    const index = mantle.geometry.index!, position = mantle.geometry.getAttribute('position');
    const a = new Vector3(), b = new Vector3(), c = new Vector3();
    let volume = 0;
    for (let i = 0; i < index.count; i += 3) { a.fromBufferAttribute(position, index.getX(i)); b.fromBufferAttribute(position, index.getX(i + 1)); c.fromBufferAttribute(position, index.getX(i + 2)); volume += a.dot(b.cross(c)) / 6; }
    assert.ok(volume > 1, 'sculpted body must be closed with outward-facing triangles');
  }
  let frame = 0;
  const step = (count: number) => {
    for (let i = 0; i < count; i++) {
      character.update(1 / 60, frame++ / 60);
      const state = character.diagnostics();
      assert.equal(state.finite, true, 'solver must remain finite');
      assert.ok(Number(state.bodyHeight) >= 0, 'body must stay above the floor');
    }
    character.object.traverse(node => {
      if (!(node instanceof Mesh)) return;
      assert.ok(node.position.toArray().every(Number.isFinite));
      for (const attribute of ['position', 'normal']) {
        const values = node.geometry.getAttribute(attribute)?.array;
        if (values) assert.ok(Array.from(values).every(Number.isFinite), `${attribute} buffer must remain finite`);
      }
    });
  };
  if (character.diagnostics().finCount !== undefined) { assert.equal(character.diagnostics().finCount, character.object.name === 'WhaleMochi' ? 4 : character.object.name === 'SharkMochi' ? 6 : 5); assert.equal(character.diagnostics().tailLobes, 2); }
  else assert.equal(Number(character.diagnostics().armCount) + Number(character.diagnostics().tentacleCount ?? 0), 10, 'eight arms plus two tentacles');
  if (character.object.name === 'WhaleMochi' || character.object.name === 'SharkMochi') { assert.equal(character.diagnostics().eyeCount, 2); assert.equal(character.diagnostics().tailPlane, character.object.name === 'WhaleMochi' ? 'horizontal' : 'vertical'); }
  character.object.updateMatrixWorld(true);
  const bodyOrigin = ['WhaleMochi', 'SharkMochi'].includes(character.object.name) ? character.object.localToWorld(new Vector3(-0.95, 6, 0.35)) : new Vector3(0.12, 6, 0.1);
  const hit = character.pick(new Raycaster(bodyOrigin, new Vector3(0, -1, 0)));
  assert.ok(hit, 'mantle must be pickable');
  assert.ok(hit.handle < 0, 'body ray must select the body, not a fin');
  character.beginGrab(hit);
  character.moveGrab(hit.point, false);
  step(40);
  assert.ok(Number(character.diagnostics().pressed) > 0.01, 'stationary hold must indent');
  character.moveGrab(hit.point.clone().add(new Vector3(1, 2, 0)), true);
  step(90);
  assert.equal(character.diagnostics().dragging, true);
  // Subtract the mean translation: lifting a rigid mesh alone must not pass.
  const position = mantle.geometry.getAttribute('position');
  const mean = new Vector3(), displacement = new Vector3();
  for (let i = 0; i < position.count; i++) mean.add(displacement.fromBufferAttribute(position, i).sub(new Vector3().fromArray(rest, i * 3)));
  mean.divideScalar(position.count);
  let deformation = 0;
  for (let i = 0; i < position.count; i++) deformation = Math.max(deformation, displacement.fromBufferAttribute(position, i).sub(new Vector3().fromArray(rest, i * 3)).sub(mean).length());
  assert.ok(deformation > 0.12, `drag must stretch the mantle beyond rigid translation (${deformation.toFixed(3)})`);
  assert.ok(Number(character.diagnostics().bodyHeight) > 0.2, 'mantle drag must lift');
  character.endGrab();
  step(360);
  assert.equal(character.diagnostics().dragging, false);
  assert.ok(Number(character.diagnostics().bodyHeight) < 0.05, 'release must settle');
  assert.ok(Number(character.diagnostics().deformationAmplitude) < 0.02, 'soft deformation must recover after release');
  for (const stiffness of [0, 1]) for (const damping of [0, 1]) {
    character.reset();
    character.setParameters({ color: '#f2a4c0', stiffness, damping });
    character.poke();
    let height = 0;
    for (let i = 0; i < 120; i++) { step(1); height = Math.max(height, Number(character.diagnostics().bodyHeight)); }
    assert.ok(height > 0.1 && height < 3.5, 'poke must produce a bounded hop');
    character.beginGrab(hit);
    character.moveGrab(new Vector3(30, 20, -30), true);
    step(90);
    character.endGrab();
    step(360);
  }
  character.reset();
  assert.equal(character.diagnostics().bodyHeight, 0);
  assert.equal(character.diagnostics().pressed, 0);
  assert.equal(character.diagnostics().dragging, false);
  if (character.diagnostics().finCount !== undefined) {
    character.object.updateMatrixWorld(true);
    const finHit = character.pick(new Raycaster(character.object.localToWorld(['WhaleMochi', 'SharkMochi'].includes(character.object.name) ? new Vector3(0.2, 6, 1.12) : new Vector3(character.object.name === 'GoldMochi' ? 1.23 : 1.15, 6, character.object.name === 'GoldMochi' ? 0.44 : 0)), new Vector3(0, -1, 0)));
    assert.ok(finHit && finHit.handle >= 0, 'side fin must be independently pickable');
    character.beginGrab(finHit);
    character.moveGrab(finHit.point.clone().add(new Vector3(0.3, 0.5, 0)), true);
    step(60);
    assert.ok(Number(character.diagnostics().maxLimbDisplacement) > 0.1, 'fin drag must deform the selected fin');
    character.endGrab();
    step(360);
    assert.ok(Number(character.diagnostics().maxLimbDisplacement) < 0.02, 'fin must recover after release');
  }
  character.dispose();
  assert.equal(character.object.children.length, 0, 'dispose must remove scene resources');
  console.log(`${create.name} passed: ${frame} frames, press, drag, release, poke, parameter extremes, reset and disposal.`);
}
