import assert from 'node:assert/strict';
import { Box3, PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import type { Character } from '../src/characters/types';
const { frameCharacter, createMovementConstraint, softenPointer } = await import(new URL('../src/core/stage.ts', import.meta.url).href) as typeof import('../src/core/stage');

for (const value of [0, .3, .79, .8]) assert.equal(softenPointer(value), value, 'central motion must follow the pointer exactly');
for (const value of [.81, .9, 1, 3, 100]) {
  assert.ok(softenPointer(value) > .8 && softenPointer(value) <= .9600001);
  assert.equal(softenPointer(-value), -softenPointer(value));
}
assert.ok(softenPointer(.80001) - softenPointer(.8) < .000011, 'entering resistance must be continuous');

for (const [file, factory, mechanical] of [
  ['octomochi', 'createOctoMochi', false], ['octomochi', 'createOctoMochi', true],
  ['cuttlemochi', 'createCuttleMochi'], ['squidmochi', 'createSquidMochi'], ['goldmochi', 'createGoldMochi'],
  ['whalemochi', 'createWhaleMochi'], ['sharkmochi', 'createSharkMochi'],
] as const) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const character: Character = characterModule[factory](mechanical);
  const bounds = new Box3().setFromObject(character.object, true);
  const camera = new PerspectiveCamera(32, 1, .1, 60);
  camera.position.set(0, 3.8, 10.8); camera.lookAt(0, 1.3, 0);
  const worldCorners: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) worldCorners.push(new Vector3(x, y, z));
  const restTransform = character.object.matrixWorld.clone();
  const localCorners = worldCorners.map(point => point.clone().applyMatrix4(restTransform.clone().invert()));
  let frame = 0, wideTravel = 0, narrowTravel = 0;
  const localBody = new Vector3(), worldOffset = new Vector3(), origin = character.object.getWorldPosition(new Vector3());
  const check = (width: number, height: number) => {
    const state = character.diagnostics();
    assert.equal(state.finite, true);
    assert.ok(Number(state.bodyHeight) >= 0);
    localBody.set(Number(state.bodyX), Number(state.bodyHeight), Number(state.bodyZ));
    worldOffset.copy(localBody).applyMatrix4(character.object.matrixWorld).sub(origin);
    for (const corner of localCorners) {
      const point = corner.clone().add(localBody).applyMatrix4(character.object.matrixWorld).project(camera);
      assert.ok(Math.abs(point.x) <= 1 - 24 / width + .001, `${file}: whole resting silhouette must stay horizontally visible (${point.x})`);
      assert.ok(point.y <= 1 - 32 / height + .001 && point.y >= -1 + 136 / height - .001, `${file}: silhouette must stay above the label and below the top (${point.y})`);
    }
    return Math.abs(worldOffset.x);
  };
  for (const [width, height] of [[1280, 660], [390, 540], [600, 440]]) {
    character.reset();
    frameCharacter(camera, bounds, width, height);
    character.setMovementConstraint(createMovementConstraint(camera, character.object, bounds, width, height, restTransform));
    const projected = worldCorners.map(point => point.clone().project(camera));
    const projectedHeight = (Math.max(...projected.map(p => p.y)) - Math.min(...projected.map(p => p.y))) * height / 2;
    assert.ok(projectedHeight <= Math.min(height * .5, 340) + .001, 'resizing must reserve play space instead of enlarging the pal to fill it');
    const bodyOrigin = ['whalemochi', 'sharkmochi'].includes(file) ? character.object.localToWorld(new Vector3(-.95, 6, .35)) : new Vector3(.12, 6, .1);
    const hit = character.pick(new Raycaster(bodyOrigin, new Vector3(0, -1, 0)));
    assert.ok(hit && hit.handle < 0, `${file}: body must be independently draggable`);
    const plane = new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()), hit.point);
    for (const [x, y] of [[.9, .5], [-3, .3], [.2, 3]]) {
      character.beginGrab(hit);
      const ray = new Raycaster(); ray.setFromCamera(new Vector2(softenPointer(x), softenPointer(y)), camera);
      const target = ray.ray.intersectPlane(plane, new Vector3())!;
      target.y = Math.max(.08, target.y);
      character.moveGrab(target, true);
      for (let i = 0; i < 120; i++) {
        character.update(1 / 60, frame++ / 60); check(width, height);
        // Rebuilding after a turn must still use the original resting pose.
        if (i === 60) character.setMovementConstraint(createMovementConstraint(camera, character.object, bounds, width, height, restTransform));
      }
      if (x === .9) {
        if (width === 1280) wideTravel = check(width, height);
        if (width === 390) narrowTravel = check(width, height);
      }
      character.endGrab();
      for (let i = 0; i < 240; i++) { character.update(1 / 60, frame++ / 60); check(width, height); }
      assert.ok(Number(character.diagnostics().bodyHeight) < .05, 'release must still settle on the floor');
      character.reset();
    }
  }
  assert.ok(wideTravel > 2.6, `${file}: wide stage must allow travel beyond the previous 2.6 limit (${wideTravel})`);
  assert.ok(wideTravel > narrowTravel + .5, `${file}: movement boundary must adapt to the viewport`);
  character.dispose();
  console.log(`${file}${mechanical ? ' (mechanical)' : ''}: frame fit, edge drag, release; wide travel ${wideTravel.toFixed(2)}, mobile ${narrowTravel.toFixed(2)}.`);
}
