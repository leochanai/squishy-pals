import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshPhysicalNodeMaterial, Vector3, type Raycaster } from 'three/webgpu';
import type { MaterialPreset } from './types';

type Surface = { mesh: Mesh; axis: 'x' | 'y' | 'z'; bands: number; sectors?: number; progress?: Float32Array };

/** Raised, separated plates follow each source surface's existing deformation. */
export function createMechanicalShell(surfaces: Surface[]) {
  const entries = surfaces.map(surface => {
    const source = surface.mesh.geometry;
    source.computeBoundingBox();
    const box = source.boundingBox!, center = box.getCenter(new Vector3());
    const axes = ['x', 'y', 'z'] as const;
    const transverse = axes.filter(axis => axis !== surface.axis);
    const position = source.getAttribute('position');
    const point = new Vector3(), triangles = new Map<number, number[]>();
    const index = source.getIndex();
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const ids = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
      point.set(0, 0, 0);
      for (const id of ids) point.add(new Vector3().fromBufferAttribute(position, id));
      point.divideScalar(3);
      const progress = surface.progress
        ? ids.reduce((sum, id) => sum + surface.progress![id], 0) / 3
        : (point[surface.axis] - box.min[surface.axis]) / Math.max(0.001, box.max[surface.axis] - box.min[surface.axis]);
      const band = Math.min(surface.bands - 1, Math.floor(progress * surface.bands));
      const angle = Math.atan2(point[transverse[0]] - center[transverse[0]], point[transverse[1]] - center[transverse[1]]) + Math.PI;
      const sectors = surface.sectors ?? 1;
      const sector = Math.min(sectors - 1, Math.floor(angle / (Math.PI * 2) * sectors));
      const key = band * sectors + sector;
      if (!triangles.has(key)) triangles.set(key, []);
      triangles.get(key)!.push(...ids);
    }
    const original = surface.mesh.material as MeshPhysicalNodeMaterial;
    const paint = original.clone();
    paint.metalness = 0.8; paint.roughness = 0.32; paint.transmission = 0;
    paint.clearcoat = 0.2;
    const liner = original.clone();
    liner.color.set('#263540'); liner.metalness = 0.65; liner.roughness = 0.46; liner.transmission = 0;
    const root = new Group(); root.name = 'mechanical-shell'; root.visible = false;
    surface.mesh.add(root);
    const panels = [...triangles.values()].map(ids => {
      const vertices = [...new Set(ids)], lookup = new Map(vertices.map((id, i) => [id, i]));
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(vertices.length * 3, 3));
      geometry.setAttribute('normal', new Float32BufferAttribute(vertices.length * 3, 3));
      if (source.hasAttribute('color')) geometry.setAttribute('color', new Float32BufferAttribute(vertices.length * 3, 3));
      geometry.setIndex(ids.map(id => lookup.get(id)!));
      const mesh = new Mesh(geometry, paint); mesh.name = 'armor-panel'; mesh.frustumCulled = false;
      mesh.castShadow = true; mesh.userData.sourceMesh = surface.mesh; root.add(mesh);
      return { mesh, vertices, center: new Vector3() };
    });
    return { ...surface, root, paint, liner, panels, original };
  });
  let enabled = false;
  function update() {
    if (!enabled) return;
    for (const entry of entries) {
      const source = entry.mesh.geometry, positions = source.getAttribute('position'), normals = source.getAttribute('normal'), colors = source.getAttribute('color');
      for (const panel of entry.panels) {
        const geometry = panel.mesh.geometry, target = geometry.getAttribute('position'), normal = geometry.getAttribute('normal'), color = geometry.getAttribute('color');
        panel.center.set(0, 0, 0);
        for (const id of panel.vertices) { panel.center.x += positions.getX(id); panel.center.y += positions.getY(id); panel.center.z += positions.getZ(id); }
        panel.center.divideScalar(panel.vertices.length);
        panel.vertices.forEach((id, i) => {
          // Narrow dark channels expose the flexible joint liner between plates.
          target.setXYZ(i, positions.getX(id) * 0.965 + panel.center.x * 0.035 + normals.getX(id) * 0.025,
            positions.getY(id) * 0.965 + panel.center.y * 0.035 + normals.getY(id) * 0.025,
            positions.getZ(id) * 0.965 + panel.center.z * 0.035 + normals.getZ(id) * 0.025);
          normal.setXYZ(i, normals.getX(id), normals.getY(id), normals.getZ(id));
          if (color) color.setXYZ(i, colors.getX(id), colors.getY(id), colors.getZ(id));
        });
        target.needsUpdate = normal.needsUpdate = true;
        if (color) color.needsUpdate = true;
        geometry.computeBoundingSphere();
      }
    }
  }
  return {
    set(preset: MaterialPreset) {
      enabled = preset === 'mechanical';
      for (const entry of entries) {
        entry.root.visible = enabled;
        if (enabled) {
          entry.paint.color.copy(entry.original.color);
          entry.mesh.material = entry.liner;
        }
      }
      update();
    },
    update,
    pick(raycaster: Raycaster) {
      if (!enabled) return null;
      const meshes = entries.flatMap(entry => [entry.mesh, ...entry.panels.map(panel => panel.mesh)]);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit?.object.userData.sourceMesh) hit.object = hit.object.userData.sourceMesh;
      return hit ?? null;
    },
    dispose() {
      for (const entry of entries) {
        entry.mesh.material = entry.original;
        entry.root.removeFromParent();
        entry.panels.forEach(panel => panel.mesh.geometry.dispose());
        entry.paint.dispose(); entry.liner.dispose();
      }
    },
  };
}
