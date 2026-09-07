import { Box3, Matrix3, PerspectiveCamera, Plane, Vector3, type Group } from 'three/webgpu';
import type { MovementConstraint } from '../characters/types';

function corners(bounds: Box3) {
  const points: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new Vector3(x, y, z));
  return points;
}

/** Fit the resting silhouette, leaving new pixels available for play. */
export function frameCharacter(camera: PerspectiveCamera, bounds: Box3, width: number, height: number) {
  const backward = camera.getWorldDirection(new Vector3()).negate();
  const center = bounds.getCenter(new Vector3());
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  camera.aspect = width / height;
  camera.fov = 32;
  const tangent = Math.tan(camera.fov * Math.PI / 360);
  const verticalFill = Math.min(.5, 340 / height);
  const horizontalFill = .64;
  let distance = 0;
  for (const corner of corners(bounds)) {
    corner.sub(center);
    const depth = corner.dot(backward);
    distance = Math.max(distance, depth + Math.abs(corner.dot(up)) / (tangent * verticalFill), depth + Math.abs(corner.dot(right)) / (tangent * camera.aspect * horizontalFill));
  }
  camera.position.copy(center).addScaledVector(backward, distance);
  camera.lookAt(center);
  camera.far = Math.max(60, distance + bounds.getSize(new Vector3()).length() * 4);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

/** Screen-edge resistance stays continuous even with a captured pointer outside the canvas. */
export function softenPointer(value: number) {
  const distance = Math.abs(value);
  return distance <= .8 ? value : Math.sign(value) * (.8 + .16 * (1 - Math.exp(-(distance - .8) / .16)));
}

/** Keep the resting envelope plus a deformation margin inside the camera's side planes.
 * Half-spaces also handle rotated animals, unlike an axis-aligned local movement box.
 */
export function createMovementConstraint(camera: PerspectiveCamera, object: Group, bounds: Box3, width: number, height: number): MovementConstraint {
  const forward = camera.getWorldDirection(new Vector3());
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const tangent = Math.tan(camera.fov * Math.PI / 360);
  const horizontal = tangent * camera.aspect * (1 - 24 / width);
  const top = tangent * (1 - 32 / height);
  const bottom = tangent * (1 - 136 / height);
  const normals = [
    right.clone().addScaledVector(forward, horizontal), right.clone().negate().addScaledVector(forward, horizontal),
    up.clone().negate().addScaledVector(forward, top), up.clone().addScaledVector(forward, bottom),
  ];
  const points = corners(bounds);
  const toLocalNormal = new Matrix3().setFromMatrix4(object.matrixWorld).transpose();
  const planes = normals.map(normal => {
    normal.normalize();
    const constant = Math.min(...points.map(point => normal.dot(point.clone().sub(camera.position)))) - .3;
    const localNormal = normal.applyMatrix3(toLocalNormal);
    const length = localNormal.length();
    return new Plane(localNormal.divideScalar(length), constant / length);
  });
  // Floor handling (impact and squash) stays inside each character's solver.
  const floor = new Plane(new Vector3(0, 1, 0), 0);
  planes.push(floor);
  return (position, velocity) => {
    for (let pass = 0; pass < 8; pass++) {
      let corrected = false;
      for (const plane of planes) {
        const distance = plane.distanceToPoint(position);
        if (distance >= 0) continue;
        position.addScaledVector(plane.normal, -distance);
        if (velocity) {
          const outward = velocity.dot(plane.normal);
          if (outward < 0) velocity.addScaledVector(plane.normal, -outward);
        }
        corrected = true;
      }
      if (!corrected) break;
    }
  };
}
