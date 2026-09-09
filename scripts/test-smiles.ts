import assert from 'node:assert/strict';
import { Mesh, Triangle, TubeGeometry, Vector3 } from 'three/webgpu';
import { createWhaleMochi } from '../src/characters/whalemochi.ts';
import { createSharkMochi } from '../src/characters/sharkmochi.ts';

for (const create of [createWhaleMochi, createSharkMochi]) {
  const character = create();
  const mouths = character.object.children.filter(node => node.name === 'smile') as Mesh<TubeGeometry>[];
  assert.equal(mouths.length, 1, 'mouth must be one continuous tube');
  const body = character.object.children.find(node => node instanceof Mesh) as Mesh;
  const geometry = mouths[0].geometry, curve = geometry.parameters.path;
  const triangle = new Triangle(), closest = new Vector3(), nearest = new Vector3(), normal = new Vector3();
  function checkSurface(point: Vector3) {
    const positions = body.geometry.getAttribute('position'), index = body.geometry.index!;
    let distance = Infinity;
    for (let i = 0; i < index.count; i += 3) {
      triangle.a.fromBufferAttribute(positions, index.getX(i));
      triangle.b.fromBufferAttribute(positions, index.getX(i + 1));
      triangle.c.fromBufferAttribute(positions, index.getX(i + 2));
      triangle.closestPointToPoint(point, closest);
      const candidate = point.distanceToSquared(closest);
      if (candidate < distance) {
        distance = candidate; nearest.copy(closest); triangle.getNormal(normal);
      }
    }
    const signedDistance = point.clone().sub(nearest).dot(normal);
    // A crease can intersect the skin, but its center must not be buried;
    // tolerate one tube radius of separation on the coarsely sampled skin.
    assert.ok(signedDistance > -geometry.parameters.radius * 0.5, `${create.name}: mouth buried in skin (${signedDistance})`);
    assert.ok(Math.sqrt(distance) < geometry.parameters.radius + 0.015, `${create.name}: mouth floats off skin (${Math.sqrt(distance)})`);
  }
  for (let i = 0; i <= 40; i++) checkSurface(curve.getPoint(i / 40));
  for (let i = 0; i < 40; i++) {
    const a = curve.getPoint(i / 80), b = curve.getPoint((i + 1) / 80);
    assert.ok(a.y >= b.y - 0.001, `${create.name}: mouth rises at the center instead of the corners`);
  }
  for (let i = 1; i < 320; i++) {
    const before = curve.getTangent((i - 1) / 320), after = curve.getTangent(i / 320);
    assert.ok(before.dot(after) > 0.75, `${create.name}: abrupt mouth corner at ${i / 320}`);
  }
  for (const material of ['original', 'jelly', 'mechanical'] as const) {
    character.setParameters({ material }); character.poke();
    for (let frame = 0; frame < 12; frame++) character.update(1 / 60, frame / 60);
    const positions = geometry.getAttribute('position');
    for (const value of positions.array) assert.ok(Number.isFinite(value));
    // Average each tube ring to recover the deformed centerline.
    for (let ring = 0; ring <= geometry.parameters.tubularSegments; ring += 12) {
      const center = new Vector3();
      for (let j = 0; j < geometry.parameters.radialSegments; j++) {
        center.add(new Vector3().fromBufferAttribute(positions, ring * (geometry.parameters.radialSegments + 1) + j));
      }
      checkSurface(center.divideScalar(geometry.parameters.radialSegments));
    }
  }
  character.dispose();
  console.log(`${create.name}: continuous mouth follows skin before and after deformation in all materials`);
}
