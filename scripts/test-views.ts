import assert from 'node:assert/strict';
import { Box3, Raycaster, Vector3 } from 'three/webgpu';
import type { Character } from '../src/characters/types';
import { createAccessories } from '../src/core/accessories.ts';

for (const [id, file, factory, front, side] of [
  ['octomochi', 'octopus', 'createOctopus', 0, Math.PI / 2],
  ['cuttlemochi', 'cuttlemochi', 'createCuttleMochi', 0, Math.PI / 2],
  ['squidmochi', 'squidmochi', 'createSquidMochi', 0, Math.PI / 2],
  ['sealmochi', 'coastalmochi', 'createSealMochi', 0, Math.PI / 2],
  ['turtlemochi', 'coastalmochi', 'createTurtleMochi', 0, Math.PI / 2],
  ['crabmochi', 'coastalmochi', 'createCrabMochi', 0, Math.PI / 2],
  ['goldmochi', 'goldmochi', 'createGoldMochi', -0.2, Math.PI / 2],
  ['whalemochi', 'whalemochi', 'createWhaleMochi', Math.PI / 2, 0],
  ['sharkmochi', 'sharkmochi', 'createSharkMochi', Math.PI / 2, 0],
] as const) {
  const characterModule = await import(`../src/characters/${file}.ts`);
  const character: Character = characterModule[factory]();
  assert.equal(character.object.rotation.y, front, `${id}: starts facing front`);
  const accessories = createAccessories(character, id); accessories.set(['glasses']);
  let time = 0;
  for (const material of ['original', 'jelly', 'mechanical'] as const) {
    character.setParameters({ material, color: '#f2a4c0' });
    for (const view of ['front', 'side', 'front'] as const) {
      character.endGrab(); character.reset();
      character.setParameters({ view });
      character.object.updateMatrixWorld(true);
      assert.equal(character.object.rotation.y, view === 'front' ? front : side);
      const origin = character.object.localToWorld(new Vector3(id === 'whalemochi' || id === 'sharkmochi' ? -0.95 : 0.12, 6, 0.1));
      const hit = character.pick(new Raycaster(origin, new Vector3(0, -1, 0)));
      assert.ok(hit, `${id}/${material}/${view}: pickable`);
      character.beginGrab(hit);
      character.moveGrab(hit.point.clone().add(new Vector3(0.5, 0.5, 0)), true);
      for (let frame = 0; frame < 8; frame++) { time += 1 / 60; character.update(1 / 60, time); accessories.update(); }
      assert.ok(Number.isFinite(character.object.rotation.y), `${id}: drag keeps a valid heading`);
      character.endGrab(); character.setParameters({ view });
      assert.equal(character.object.rotation.y, view === 'front' ? front : side, `${id}: manual view restores heading after dragging`);
      assert.equal(character.diagnostics().finite, true);
      assert.equal(character.object.getObjectByName('glasses')!.visible, true);
      const bounds = new Box3().setFromObject(character.object);
      assert.ok(Number.isFinite(bounds.min.x + bounds.max.y));
    }
  }
  accessories.dispose(); character.dispose();
  console.log(`${id}: default front, both views, all materials, dragging and accessories passed`);
}
