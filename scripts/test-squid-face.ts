import assert from 'node:assert/strict';
import { Box3, Mesh, Raycaster, Vector3 } from 'three/webgpu';
import { createSquidMochi } from '../src/characters/squidmochi.ts';
import { createAccessories } from '../src/core/accessories.ts';

const pal = createSquidMochi();
pal.object.updateMatrixWorld(true);
const faces = (pal.object.children.filter(node => node instanceof Mesh) as Mesh[]).slice(-5);
assert.equal(faces.length, 5);
const rest = faces.map(mesh => {
  mesh.updateMatrix();
  const positions = mesh.geometry.getAttribute('position');
  return Array.from({ length: positions.count }, (_, i) => new Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrix));
});
const rig = createAccessories(pal, 'squidmochi'); rig.set(['hat', 'glasses']);
const actual = new Vector3(), expected = new Vector3();
function check() {
  pal.object.updateMatrixWorld(true);
  faces.forEach((mesh, index) => {
    const positions = mesh.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      actual.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      pal.deformAccessory!(rest[index][i], expected); pal.object.localToWorld(expected);
      assert.ok(actual.distanceTo(expected) < .00001, `face ${index}, vertex ${i}: rendered face must share the body's deformation and heading (${actual.distanceTo(expected)})`);
    }
  });
}
function step(count: number) {
  // Keep eyes open so comparisons isolate deformation from the blink animation.
  for (let i = 0; i < count; i++) { pal.update(1 / 60, 0); rig.update(); check(); }
}
pal.setParameters({ material: 'jelly' });
for (const heading of [0, Math.PI / 2, -Math.PI / 2, 0]) {
  pal.setParameters({ view: heading === 0 ? 'front' : 'side' });
  pal.object.rotation.y = heading; step(2);
}
const hit = pal.pick(new Raycaster(new Vector3(.12, 6, .1), new Vector3(0, -1, 0)));
assert.ok(hit && hit.part === 'mantle');
pal.beginGrab(hit); pal.moveGrab(hit.point, false); step(20);
for (let i = 1; i <= 30; i++) { pal.moveGrab(hit.point.clone().add(new Vector3(1.2 * i / 30, .6, 0)), true); step(1); }
pal.endGrab();
pal.setParameters({ material: 'mechanical', view: 'front' }); check(); step(90);
for (const material of ['original', 'jelly', 'mechanical'] as const) {
  pal.setParameters({ material }); pal.poke(); step(90);
  pal.reset(); rig.update(); check();
}
const eyeHeight = () => new Box3().setFromObject(faces[0], true).getSize(new Vector3()).y;
const openHeight = eyeHeight();
pal.update(0, 4.99);
assert.ok(eyeHeight() < openHeight * .2 && eyeHeight() > openHeight * .05, 'vertex-based eyes must retain the blink');
pal.update(0, 5.1); check();
rig.dispose(); pal.dispose();
console.log('Squid face: held press, true body heading, immediate material/view switch, poke and reset keep all five facial surfaces on the body field.');
