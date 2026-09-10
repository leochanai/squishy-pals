import assert from 'node:assert/strict';
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import type { RegisteredCharacter } from '../src/characters/registry';
const { createCharacterCache } = await import(new URL('../src/core/character-cache.ts', import.meta.url).href) as typeof import('../src/core/character-cache');
const { frameCharacter, createMovementConstraint, softenPointer } = await import(new URL('../src/core/stage.ts', import.meta.url).href) as typeof import('../src/core/stage');

const cache = createCharacterCache(async () => {});
for (const [file, factory] of [['octopus','createOctopus'],['whalemochi','createWhaleMochi'],['coastalmochi','createSealMochi']]) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const source = { id:file, defaults:{color:'#c6a0df',material:'original',stiffness:.48,damping:.42}, load:async()=>characterModule[factory] } as RegisteredCharacter;
  const entry = await cache.prepare(source);
  assert.ok(entry.framingPoints.length > 8, 'curved shapes must retain more than box corners');
  for (const [width,height,fill] of [[1188,589,.9],[888,426.5,.887455],[786,500.4,.84],[358,303.84,.84],[288,303.84,.84],[358,220,1-48/220],[288,220,1-48/220]]) {
    const camera = new PerspectiveCamera(); camera.position.set(0,5.7,10.1); camera.lookAt(0,1.35,0); camera.updateMatrixWorld(true);
    frameCharacter(camera,entry.bounds,width,height,height*fill,entry.framingPoints,fill);
    for (const point of entry.framingPoints) {
      const projected = point.clone().project(camera);
      assert.ok(Math.abs(projected.x)<=.7601 && Math.abs(projected.y)<=fill+.0001,`${file}: resting silhouette must fit`);
    }
    const constrain = createMovementConstraint(camera,entry.character.object,entry.bounds,width,height,entry.transform,entry.framingPoints);
    const origin = new Vector3(); constrain(origin);
    assert.ok(origin.length()<.001,`${file} ${width}x${height}: resting role moved ${origin.toArray().join(',')}`);
    const center = entry.bounds.getCenter(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()), center);
    for (const [x,y] of [[-20,0],[20,0],[0,20],[0,-20]]) {
      const ray = new Raycaster(); ray.setFromCamera(new Vector2(softenPointer(x),softenPointer(y)), camera);
      const candidate = ray.ray.intersectPlane(plane,new Vector3())!;
      candidate.y = Math.max(.08,candidate.y);
      candidate.sub(center).applyMatrix4(entry.transform.clone().invert());
      constrain(candidate);
      for (const point of entry.framingPoints) {
        const projected = point.clone().applyMatrix4(entry.transform.clone().invert()).add(candidate).applyMatrix4(entry.transform).project(camera);
        assert.ok(Math.abs(projected.x)<=1-24/width+.001 && projected.y<=1-32/height+.001 && projected.y>=-1+48/height-.001,`${file} ${width}x${height}: moved silhouette outside ${projected.toArray().join(',')}, offset ${candidate.toArray().join(',')}`);
      }
    }
  }
  console.log(`${file}: actual-envelope framing, resting position and edge constraints passed (${entry.framingPoints.length} hull points).`);
}
await cache.dispose();
