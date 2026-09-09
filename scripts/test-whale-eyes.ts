import assert from 'node:assert/strict';
import { Mesh, Raycaster, Triangle, Vector3 } from 'three/webgpu';
import { createWhaleMochi } from '../src/characters/whalemochi.ts';

const whale = createWhaleMochi();
const body = whale.object.getObjectByName('whale-body') as Mesh;
const positions = body.geometry.attributes.position, indices = body.geometry.index!;
const triangle = new Triangle(), point = new Vector3(), nearest = new Vector3(), normal = new Vector3();
function surface(query: Vector3) {
  let distance = Infinity;
  for (let i = 0; i < indices.count; i += 3) {
    triangle.a.fromBufferAttribute(positions, indices.getX(i));
    triangle.b.fromBufferAttribute(positions, indices.getX(i + 1));
    triangle.c.fromBufferAttribute(positions, indices.getX(i + 2));
    triangle.closestPointToPoint(query, point);
    const candidate = point.distanceToSquared(query);
    if (candidate < distance) { distance = candidate; nearest.copy(point); triangle.getNormal(normal); }
  }
  return query.clone().sub(nearest).dot(normal);
}
const eyes = ['left-eye', 'right-eye'].map(name => {
  const mesh = whale.object.getObjectByName(`${name}-surface`) as Mesh;
  const center = whale.object.getObjectByName(name)!.position.clone();
  surface(center);
  const outward = normal.clone(), attribute = mesh.geometry.attributes.position;
  let inner = 0, outer = 0, minimum = Infinity, maximum = -Infinity;
  for (let i = 0; i < attribute.count; i++) {
    const depth = point.fromBufferAttribute(attribute, i).sub(center).dot(outward);
    if (depth < minimum) { minimum = depth; inner = i; }
    if (depth > maximum) { maximum = depth; outer = i; }
  }
  return { name, attribute, inner, outer, center, outward };
});
let time = 0;
function check(label: string) {
  assert.equal(whale.diagnostics().finite, true);
  for (const eye of eyes) {
    const inner = new Vector3().fromBufferAttribute(eye.attribute, eye.inner);
    const outer = new Vector3().fromBufferAttribute(eye.attribute, eye.outer);
    assert.ok(surface(inner) < -.005, `${label}: ${eye.name} retains an embedded skin attachment`);
    assert.ok(surface(outer) > .01, `${label}: ${eye.name} remains visible above the skin`);
  }
}
function step(frames: number, label: string) {
  for (let frame = 0; frame < frames; frame++) {
    whale.update(1 / 60, time += 1 / 60);
    if (frame % 6 === 0 || frame === frames - 1) check(label);
  }
}
for (const material of ['original', 'jelly', 'mechanical'] as const) {
  whale.reset(); whale.setParameters({ material }); check(`${material}: rest`);
  whale.object.updateMatrixWorld(true);
  const eye = eyes[1];
  const origin = whale.object.localToWorld(eye.center.clone().addScaledVector(eye.outward, 2));
  const direction = eye.outward.clone().negate().transformDirection(whale.object.matrixWorld);
  const hit = whale.pick(new Raycaster(origin, direction));
  assert.ok(hit && hit.handle < 0, 'the cheek can be pressed');
  whale.beginGrab(hit); whale.moveGrab(hit.point, false); step(36, `${material}: press`);
  whale.moveGrab(hit.point.clone().add(new Vector3(.7, .9, .2)), true); step(45, `${material}: drag`);
  whale.endGrab(); whale.poke(); step(90, `${material}: poke after drag`);
  step(240, `${material}: recovery`);
  assert.ok(Number(whale.diagnostics().deformationAmplitude) < .02);
  console.log(`${material}: both whale eyes stay embedded during press, drag, poke and recovery`);
}
whale.dispose();
