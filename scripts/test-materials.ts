import assert from 'node:assert/strict';
import { Color, Mesh, MeshPhysicalNodeMaterial, Raycaster, Vector3, type Material } from 'three/webgpu';
import type { Character } from '../src/characters/types';
import { createAccessories } from '../src/core/accessories.ts';

for (const id of ['octomochi', 'cuttlemochi', 'squidmochi', 'goldmochi', 'whalemochi', 'sharkmochi', 'mechaocto']) {
  const moduleId = id === 'mechaocto' ? 'octomochi' : id;
  const characterModule = await import(new URL(`../src/characters/${moduleId}.ts`, import.meta.url).href);
  const create = Object.values(characterModule).find(value => typeof value === 'function') as (mechanical?: boolean) => Character;
  const character = create(id === 'mechaocto');
  character.setParameters({ color: '#f2a4c0', stiffness: 0.23, damping: 0.81 });
  const meshes: Mesh[] = [];
  character.object.traverse(node => { if (node instanceof Mesh) meshes.push(node); });
  const originals = meshes.map(mesh => mesh.material);
  const geometry = meshes.map(mesh => mesh.geometry);
  const colors = meshes.map(mesh => mesh.geometry.getAttribute('color')?.array.slice());
  const shape = meshes.map(mesh => mesh.geometry.getAttribute('position').array.slice());
  const originalJson = originals.map(material => (material as Material).toJSON());
  const resources = new Map<Material, number>();
  const trackMaterials = () => {
    for (const mesh of meshes) {
      const material = mesh.material as Material;
      if (!resources.has(material)) {
        resources.set(material, 0);
        material.addEventListener('dispose', () => resources.set(material, resources.get(material)! + 1));
      }
    }
  };
  trackMaterials();
  const wardrobe = createAccessories(character, id);
  wardrobe.set(['glasses']);
  const accessory = character.object.getObjectByName('accessories')!;
  const glasses = accessory.getObjectByName('glasses')!;
  const glassesMaterial = (glasses.children[0] as Mesh).material;
  character.object.updateMatrixWorld(true);
  const origin = character.object.localToWorld(['whalemochi', 'sharkmochi'].includes(id) ? new Vector3(-0.95, 6, 0.35) : new Vector3(0.12, 6, 0.1));
  const hit = character.pick(new Raycaster(origin, new Vector3(0, -1, 0)));
  assert.ok(hit, `${id}: body remains pickable`);
  character.beginGrab(hit);
  character.moveGrab(hit.point.clone().add(new Vector3(0.2, 0.3, 0)), true);
  const grabbed = character.diagnostics();

  character.setParameters({ material: 'jelly' }); trackMaterials();
  const jelly = meshes.map(mesh => mesh.material);
  const changed = meshes.map((mesh, index) => mesh.material !== originals[index]);
  assert.ok(changed.some(Boolean), `${id}: jelly changes body surfaces`);
  for (let i = 0; i < meshes.length; i++) {
    const material = meshes[i].material as MeshPhysicalNodeMaterial;
    if (changed[i]) {
      assert.ok(material.transmission > 0.5 && material.metalness === 0, `${id}: jelly transmits light`);
      assert.equal(material.vertexColors, (originals[i] as MeshPhysicalNodeMaterial).vertexColors);
      assert.equal(material.depthWrite, true, `${id}: jelly must occlude far-side facial details`);
    } else {
      assert.equal(material.transparent, true, `${id}: faces stay out of the opaque refraction buffer`);
      assert.equal(material.depthTest, true, `${id}: rear faces remain occluded`);
      assert.equal(meshes[i].renderOrder, 1, `${id}: faces draw after the body`);
    }
    // All physical surfaces except the dark eyes/mouth must participate.
    const original = originals[i];
    if (original instanceof MeshPhysicalNodeMaterial && original.roughness >= 0.28) assert.ok(changed[i], `${id}: body, fins and trim switch together`);
    assert.equal(meshes[i].geometry, geometry[i], `${id}: geometry must not be rebuilt`);
    assert.deepEqual(meshes[i].geometry.getAttribute('position').array, shape[i], `${id}: switching preserves pose`);
    assert.deepEqual(meshes[i].geometry.getAttribute('color')?.array, colors[i], `${id}: preserve belly/fin colors`);
  }
  assert.deepEqual(character.diagnostics(), grabbed, `${id}: switching preserves the active grab and physics state`);
  assert.equal(glasses.visible, true); assert.equal((glasses.children[0] as Mesh).material, glassesMaterial);

  character.setParameters({ material: 'metal' }); trackMaterials();
  const metal = meshes.map(mesh => mesh.material);
  for (let i = 0; i < meshes.length; i++) if (changed[i]) {
    const material = metal[i] as MeshPhysicalNodeMaterial;
    assert.equal(material.transmission, 0, `${id}: metal must not retain jelly transmission`);
    assert.ok(material.metalness > 0.8, `${id}: metal is reflective`);
  }
  for (let cycle = 0; cycle < 3; cycle++) {
    character.setParameters({ material: 'jelly' });
    meshes.forEach((mesh, i) => assert.equal(mesh.material, jelly[i], `${id}: reuse jelly instances`));
    character.setParameters({ material: 'metal' });
    meshes.forEach((mesh, i) => assert.equal(mesh.material, metal[i], `${id}: reuse metal instances`));
  }
  character.setParameters({ material: 'original' });
  meshes.forEach((mesh, i) => {
    assert.equal(mesh.material, originals[i]);
    assert.deepEqual((mesh.material as Material).toJSON(), originalJson[i], `${id}: restore the complete original material`);
  });
  character.setParameters({ material: 'jelly', color: '#9cccbc' });
  character.setParameters({ material: 'metal' });
  for (let i = 0; i < meshes.length; i++) if (changed[i]) {
    assert.ok((meshes[i].material as MeshPhysicalNodeMaterial).color.equals((originals[i] as MeshPhysicalNodeMaterial).color), `${id}: color follows cached presets`);
  }
  assert.ok(meshes.some(mesh => (mesh.material as MeshPhysicalNodeMaterial).color?.equals(new Color('#9cccbc'))), `${id}: color remains editable`);
  character.update(1 / 60, 1 / 60); wardrobe.update();
  assert.equal(character.diagnostics().finite, true);
  character.endGrab(); character.reset(); character.setParameters({ material: 'original' });
  meshes.forEach((mesh, i) => assert.equal(mesh.material, originals[i]));
  assert.equal(character.diagnostics().grabbedPart, 'none');
  wardrobe.dispose(); character.dispose();
  for (const count of resources.values()) assert.equal(count, 1, `${id}: release active and cached materials exactly once`);
  console.log(`${id}: material switching, color, pose, accessories, reset and disposal passed`);
}
