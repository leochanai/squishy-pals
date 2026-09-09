import assert from 'node:assert/strict';
import { Box3, BufferAttribute, Mesh, PerspectiveCamera, Raycaster, Vector3 } from 'three/webgpu';
import { createSealMochi, createTurtleMochi, createCrabMochi } from '../src/characters/coastalmochi.ts';
import { createAccessories } from '../src/core/accessories.ts';
import { frameCharacter, createMovementConstraint } from '../src/core/stage.ts';

for (const [id, create, limbName] of [
  ['sealmochi', createSealMochi, 'flipper-1'],
  ['turtlemochi', createTurtleMochi, 'head'],
  ['crabmochi', createCrabMochi, 'claw-palm-1'],
] as const) {
  const pal = create();
  let time = 0;
  const step = (frames: number) => {
    for (let i = 0; i < frames; i++) { time += 1 / 60; pal.update(1 / 60, time); }
    assert.equal(pal.diagnostics().finite, true);
    pal.object.traverseVisible(node => {
      if (!(node instanceof Mesh)) return;
      for (const value of node.geometry.attributes.position.array) assert.ok(Number.isFinite(value));
    });
  };
  const body = pal.object.getObjectByName('body') as Mesh;
  const rest = body.geometry.attributes.position.array.slice();
  const bodyBounds = new Box3().setFromObject(body);
  if (id === 'sealmochi') {
    const size = bodyBounds.getSize(new Vector3());
    assert.ok(size.z > size.x * 2, 'seal has an elongated trunk, not a ball');
    for (const side of [-1, 1]) {
      const hind = new Box3().setFromBufferAttribute((pal.object.getObjectByName(`tail-${side}`) as Mesh).geometry.attributes.position as BufferAttribute);
      assert.ok(hind.max.z < -1.9 && Math.abs(hind.min.x) < .5 && Math.abs(hind.max.x) < .5, 'hind flippers trail close behind the tapered trunk');
    }
  }
  if (id === 'turtlemochi') {
    const tail = pal.object.getObjectByName('tail'); assert.ok(tail, 'turtle has a tail');
    const tailBounds = new Box3().setFromBufferAttribute((tail as Mesh).geometry.attributes.position as BufferAttribute);
    assert.ok(tailBounds.min.z < bodyBounds.min.z - .35, 'tail visibly extends beyond the rear shell');
    assert.ok(tailBounds.max.z > -1 && tailBounds.max.y < .47, 'tail root overlaps the internal body beneath the rear opening');
  }
  pal.object.updateMatrixWorld(true);
  const hit = pal.pick(new Raycaster(new Vector3(0.12, 6, 0.1), new Vector3(0, -1, 0)));
  assert.ok(hit && hit.handle < 0);
  pal.beginGrab(hit); pal.moveGrab(hit.point, false); step(40);
  assert.ok(Number(pal.diagnostics().pressed) > 0.01);
  assert.notDeepEqual(body.geometry.attributes.position.array, rest);
  pal.moveGrab(hit.point.clone().add(new Vector3(1, 2, 0)), true); step(90);
  assert.ok(Number(pal.diagnostics().bodyHeight) > 0.2);
  assert.ok(Number(pal.diagnostics().deformationAmplitude) > 0.1);
  pal.endGrab(); step(360);
  assert.ok(Number(pal.diagnostics().bodyHeight) < 0.05);
  assert.ok(Number(pal.diagnostics().deformationAmplitude) < 0.02);
  pal.reset();
  const limb = pal.object.getObjectByName(limbName) as Mesh;
  const restBounds = new Box3().setFromBufferAttribute(limb.geometry.attributes.position as BufferAttribute);
  const tip = restBounds.getCenter(new Vector3());
  pal.object.updateMatrixWorld(true);
  const limbHit = pal.pick(new Raycaster(new Vector3(tip.x, 6, tip.z), new Vector3(0, -1, 0)));
  assert.ok(limbHit && limbHit.handle >= 0, `${id}: appendage is separately pickable`);
  pal.beginGrab(limbHit); pal.moveGrab(limbHit.point.clone().add(new Vector3(0.5, 0.8, 0.3)), true); step(60);
  assert.ok(Number(pal.diagnostics().maxLimbDisplacement) > 0.05);
  const wardrobe = createAccessories(pal, id); wardrobe.set(['glasses', 'hat']); wardrobe.update();
  const state = pal.diagnostics();
  for (const material of ['jelly', 'mechanical', 'original'] as const) {
    pal.setParameters({ material }); assert.deepEqual(pal.diagnostics(), state);
    assert.equal(pal.object.getObjectByName('glasses')!.visible, true);
  }
  pal.endGrab(); pal.reset();
  // Each poke has a different observable motion, not just a changed label.
  const before = new Box3().setFromBufferAttribute(limb.geometry.attributes.position as BufferAttribute).getCenter(new Vector3());
  pal.poke(); step(36);
  const during = new Box3().setFromBufferAttribute(limb.geometry.attributes.position as BufferAttribute).getCenter(new Vector3());
  if (id === 'turtlemochi') assert.ok(during.z < before.z - 0.35, 'head retracts into shell');
  else if (id === 'crabmochi') assert.ok(during.y > before.y + 0.2, 'both claws rise');
  else assert.ok(Number(pal.diagnostics().bodyHeight) > 0.05, 'seal hops after squashing');
  step(180);
  assert.equal(pal.diagnostics().gestureProgress, -1);
  for (const stiffness of [0, 1]) for (const damping of [0, 1]) {
    pal.reset(); pal.setParameters({ stiffness, damping });
    pal.beginGrab(hit); pal.moveGrab(new Vector3(30, 20, -30), true); step(60);
    pal.endGrab(); step(360);
    assert.ok(Number(pal.diagnostics().bodyHeight) < 0.05);
  }
  pal.reset(); pal.setParameters({ stiffness: 0.48, damping: 0.42 });
  wardrobe.set([]); pal.object.updateMatrixWorld(true);
  // Hidden accessories must not inflate the character bounds used here.
  const bounds = new Box3(); pal.object.traverseVisible(node => { if (node instanceof Mesh) bounds.union(new Box3().setFromObject(node)); });
  for (const [width, height] of [[1280, 660], [390, 540], [320, 591]]) {
    const camera = new PerspectiveCamera(32, width / height, .1, 60);
    camera.position.set(0, 3.8, 10.8); camera.lookAt(0, 1.3, 0);
    frameCharacter(camera, bounds, width, height, 340);
    const transform = pal.object.matrixWorld.clone();
    pal.setMovementConstraint(createMovementConstraint(camera, pal.object, bounds, width, height, transform));
    pal.beginGrab(hit); pal.moveGrab(new Vector3(30, 20, -30), true); step(120);
    const d = pal.diagnostics(), offset = new Vector3(Number(d.bodyX), Number(d.bodyHeight), Number(d.bodyZ));
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new Vector3(x, y, z).add(offset).project(camera);
      assert.ok(Math.abs(point.x) <= 1 - 24 / width + .002);
      assert.ok(point.y <= 1 - 32 / height + .002 && point.y >= -1 + 136 / height - .002);
    }
    pal.endGrab(); pal.reset();
  }
  pal.reset(); pal.object.updateMatrixWorld(true);
  const facePoint = pal.object.getObjectByName('left-eye')!.position.clone(); facePoint.x = 0;
  const headHit = pal.pick(new Raycaster(new Vector3(0, id === 'crabmochi' ? 1.15 : facePoint.y - .12, 6), new Vector3(0, 0, -1)));
  assert.ok(headHit, `${id}: face can be grabbed to turn`);
  pal.beginGrab(headHit); pal.moveGrab(headHit.point.clone().add(new Vector3(.03, .3, 0)), true); step(30);
  assert.equal(pal.object.rotation.y, 0, 'vertical pull does not turn');
  for (const x of [1.5, -1.5, 0]) {
    pal.moveGrab(headHit.point.clone().add(new Vector3(x, .5, 0)), true); step(90);
    if (x) assert.ok(pal.object.rotation.y * Math.sign(x) > 1.3, 'head pull turns to either side');
    else assert.ok(Math.abs(pal.object.rotation.y) < .02, 'pulling back restores front');
  }
  pal.endGrab(); pal.reset();
  wardrobe.dispose(); pal.dispose(); assert.equal(pal.object.children.length, 0);
  console.log(`${id}: press, drag, release, limbs, signature action, materials, accessories and viewport constraints passed`);
}
