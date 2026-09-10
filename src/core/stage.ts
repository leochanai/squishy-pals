import { Box3, Matrix3, Matrix4, PerspectiveCamera, Plane, Vector3, type Group } from 'three/webgpu';
import type { MovementConstraint } from '../characters/types';

function corners(bounds: Box3) {
  const points: Vector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new Vector3(x, y, z));
  return points;
}

/** Fit the resting silhouette, leaving new pixels available for play. */
export function frameCharacter(camera: PerspectiveCamera, bounds: Box3, width: number, height: number, maxProjectedHeight = 340, envelope = corners(bounds), fill = .76) {
  const backward = camera.getWorldDirection(new Vector3()).negate();
  const center = bounds.getCenter(new Vector3());
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  camera.aspect = width / height;
  camera.fov = 32;
  const tangent = Math.tan(camera.fov * Math.PI / 360);
  const verticalFill = Math.min(fill, maxProjectedHeight / height);
  const horizontalFill = .66;
  let distance = 0;
  for (const point of envelope) {
    const corner = point.clone().sub(center);
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
export function createMovementConstraint(camera: PerspectiveCamera, object: Group, bounds: Box3, width: number, height: number, restTransform = object.matrixWorld.clone(), envelope = corners(bounds)): MovementConstraint {
  const forward = camera.getWorldDirection(new Vector3());
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const tangent = Math.tan(camera.fov * Math.PI / 360);
  const horizontal = tangent * camera.aspect * (1 - 24 / width);
  const top = tangent * (1 - 32 / height);
  // Identity and action controls now sit outside the canvas.
  const bottom = tangent * (1 - 48 / height);
  const normals = [
    right.clone().addScaledVector(forward, horizontal), right.clone().negate().addScaledVector(forward, horizontal),
    up.clone().negate().addScaledVector(forward, top), up.clone().addScaledVector(forward, bottom),
  ];
  normals.forEach(normal => normal.normalize());
  const inverseRest = restTransform.clone().invert();
  const points = envelope.map(point => point.clone().applyMatrix4(inverseRest));
  const toLocalNormal = new Matrix3(), worldPoint = new Vector3();
  const planes = normals.map(() => new Plane());
  let previousTransform: Matrix4 | undefined;
  // Floor handling (impact and squash) stays inside each character's solver.
  const floor = new Plane(new Vector3(0, 1, 0), 0);
  planes.push(floor);
  return (position, velocity) => {
    // The rest envelope turns with the pal. Retain its original bind transform
    // across resize, and refresh camera constraints whenever the heading changes.
    if (!previousTransform?.equals(object.matrixWorld)) {
      previousTransform ??= new Matrix4();
      previousTransform.copy(object.matrixWorld);
      toLocalNormal.setFromMatrix4(object.matrixWorld).transpose();
      for (let i = 0; i < normals.length; i++) {
        let constant = Infinity;
        for (const point of points) constant = Math.min(constant, normals[i].dot(worldPoint.copy(point).applyMatrix4(object.matrixWorld).sub(camera.position)));
        const normal = planes[i].normal.copy(normals[i]).applyMatrix3(toLocalNormal);
        const length = normal.length();
        normal.divideScalar(length);
        // Reserve deformation room only where the resting envelope has space.
        planes[i].constant = (constant - Math.min(.3, Math.max(0, constant))) / length;
      }
    }
    for (let pass = 0; pass < 128; pass++) {
      let corrected = false;
      for (const plane of planes) {
        const distance = plane.distanceToPoint(position);
        if (distance >= (plane === floor ? 0 : -1e-9)) continue;
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
