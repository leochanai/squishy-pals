import assert from 'node:assert/strict';
import { Box3, Mesh, Vector3 } from 'three/webgpu';
import type { Character } from '../src/characters/types';
const { createAccessories } = await import(new URL('../src/core/accessories.ts', import.meta.url).href) as typeof import('../src/core/accessories');
const { toggleAccessory } = await import(new URL('../src/core/accessory-options.ts', import.meta.url).href) as typeof import('../src/core/accessory-options');

assert.deepEqual(toggleAccessory(['headphones', 'hat', 'glasses'], 'bow'), ['headphones', 'glasses', 'bow']);
assert.deepEqual(toggleAccessory(['headphones', 'glasses'], 'glasses'), ['headphones']);
for (const id of ['octomochi', 'cuttlemochi', 'squidmochi', 'goldmochi', 'whalemochi', 'sharkmochi', 'mechaocto']) {
  const moduleId = id === 'mechaocto' ? 'octomochi' : id;
  const characterModule = await import(new URL(`../src/characters/${moduleId}.ts`, import.meta.url).href);
  const create = Object.values(characterModule).find(value => typeof value === 'function') as (mechanical?: boolean) => Character;
  const pal = create(id === 'mechaocto');
  pal.reset(); pal.object.updateMatrixWorld(true);
  const children = pal.object.children.length;
  const rig = createAccessories(pal, moduleId);
  const root = pal.object.getObjectByName('accessories')!;
  assert.equal(root.children.filter(group => group.visible).length, 0);
  rig.set(['headphones', 'hat', 'glasses']);
  pal.object.updateMatrixWorld(true);
  assert.equal(root.children.filter(group => group.visible).length, 3);
  const mesh = root.getObjectByName('glasses')!.children[0] as Mesh;
  const resting = new Box3().setFromObject(mesh, true).getCenter(new Vector3());
  pal.poke();
  for (let i = 0; i < 15; i++) { pal.update(1 / 60, i / 60); rig.update(); }
  const jumping = new Box3().setFromObject(mesh, true).getCenter(new Vector3());
  assert.ok(jumping.distanceTo(resting) > .03, `${id}: glasses must follow the jumping body`);
  for (const group of root.children) for (const child of group.children) {
    const positions = (child as Mesh).geometry.getAttribute('position');
    assert.ok(Array.from(positions.array).every(Number.isFinite), `${id}: accessory geometry must stay finite`);
  }
  pal.reset(); rig.update();
  const reset = new Box3().setFromObject(mesh, true).getCenter(new Vector3());
  assert.ok(reset.distanceTo(resting) < .0001, `${id}: accessories return with the body`);
  rig.set([]); assert.ok(root.children.every(group => !group.visible));
  rig.dispose(); assert.equal(pal.object.children.length, children);
  pal.dispose();
  console.log(`${id}: layering, jump, reset, removal and disposal passed`);
}
