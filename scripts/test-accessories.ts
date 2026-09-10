import assert from 'node:assert/strict';
import { Box3, Mesh, Vector3 } from 'three/webgpu';
import type { Character } from '../src/characters/types';
const { createAccessories } = await import(new URL('../src/core/accessories.ts', import.meta.url).href) as typeof import('../src/core/accessories');
const { toggleAccessory } = await import(new URL('../src/core/accessory-options.ts', import.meta.url).href) as typeof import('../src/core/accessory-options');

assert.deepEqual(toggleAccessory(['headphones', 'hat', 'glasses'], 'bow'), ['headphones', 'glasses', 'bow']);
assert.deepEqual(toggleAccessory(['headphones', 'glasses'], 'glasses'), ['headphones']);
for (const id of ['octomochi', 'cuttlemochi', 'squidmochi', 'goldmochi', 'clownmochi', 'whalemochi', 'sharkmochi', 'mechaocto']) {
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
  if (id === 'squidmochi') {
    const hat = root.getObjectByName('hat')!;
    const crown = hat.children[0] as Mesh, brim = hat.children[1] as Mesh;
    const crownBounds = new Box3().setFromObject(crown, true), brimBounds = new Box3().setFromObject(brim, true);
    const center = crownBounds.getCenter(new Vector3());
    const positions = crown.geometry.getAttribute('position');
    const ringRadius = (y: number) => {
      let radius = 0;
      for (let i = 0; i < positions.count; i++) if (Math.abs(positions.getY(i) - y) < .0001) radius = Math.max(radius, Math.hypot(positions.getX(i) - center.x, positions.getZ(i) - center.z));
      return radius;
    };
    const bottomRadius = ringRadius(crownBounds.min.y), topRadius = ringRadius(crownBounds.max.y);
    for (const material of ['original', 'jelly', 'mechanical'] as const) {
      pal.setParameters({ material }); rig.update();
      let enclosed = 0, highest = -Infinity;
      pal.object.traverse(node => {
        if (!(node instanceof Mesh)) return;
        const source = node.userData.sourceMesh as Mesh | undefined;
        if (node.name !== 'squid-mantle-fin' && !(node.name === 'armor-panel' && source?.name === 'squid-mantle-fin' && node.parent!.visible)) return;
        const vertices = node.geometry.getAttribute('position');
        for (let i = 0; i < vertices.count; i++) {
          const y = vertices.getY(i); highest = Math.max(highest, y);
          if (y <= brimBounds.max.y) continue;
          const t = (y - crownBounds.min.y) / (crownBounds.max.y - crownBounds.min.y);
          const radius = (bottomRadius + (topRadius - bottomRadius) * t) * Math.cos(Math.PI / 40);
          assert.ok(y < crownBounds.max.y && Math.hypot(vertices.getX(i) - center.x, vertices.getZ(i) - center.z) < radius, `${id}/${material}: upper mantle and fins must remain inside the crown above the brim`);
          enclosed++;
        }
      });
      assert.ok(enclosed > 0 && highest > brimBounds.max.y + .15, `${id}: hat must seat around the head, not float above it`);
    }
    pal.setParameters({ material: 'original' });
  }
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
