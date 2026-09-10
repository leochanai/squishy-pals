import { Color, Mesh, type Group, type Material, type MeshPhysicalNodeMaterial } from 'three/webgpu';
import type { MaterialPreset } from './types';

const white = new Color('white');

/** Only explicitly registered body surfaces change; faces and accessories stay intact. */
export function createMaterialVariants(object: Group, surfaces: { material: MeshPhysicalNodeMaterial; thickness: number }[], faces: Material[]) {
  // Draw faces after the body, outside the opaque refraction buffer. The body's
  // depth still hides far-side eyes and mouths instead of refracting duplicates.
  object.traverse(child => {
    if (child instanceof Mesh && !Array.isArray(child.material) && faces.includes(child.material)) {
      child.material.transparent = true; child.renderOrder = 1;
    }
  });
  const materials = new Set<MeshPhysicalNodeMaterial>(surfaces.map(surface => surface.material));
  const entries = surfaces.map(({ material, thickness }) => {
    const meshes: Mesh[] = [];
    object.traverse(child => { if (child instanceof Mesh && child.material === material) meshes.push(child); });
    return { original: material, thickness, meshes, variants: new Map<MaterialPreset, MeshPhysicalNodeMaterial>([['original', material]]) };
  });
  return {
    materials,
    set(preset: MaterialPreset) {
      for (const entry of entries) {
        let material = entry.variants.get(preset);
        if (!material) {
          material = entry.original.clone();
          if (preset === 'jelly') {
            material.metalness = 0; material.roughness = 0.16;
            material.clearcoat = 0.55; material.clearcoatRoughness = 0.12;
            material.transmission = 0.58; material.thickness = entry.thickness;
            material.ior = 1.36; material.attenuationDistance = 0.9;
          } else {
            material.metalness = 0.92; material.roughness = 0.28;
            material.clearcoat = 0.2; material.clearcoatRoughness = 0.22;
            material.transmission = 0; material.thickness = 0;
            material.ior = 1.5; material.attenuationDistance = Infinity;
            material.attenuationColor.set('white');
          }
          entry.variants.set(preset, material); materials.add(material);
        }
        // Original materials retain each character's color and vertex-color rules.
        if (material !== entry.original) material.color.copy(entry.original.color);
        if (preset === 'jelly') {
          material.attenuationColor.copy(entry.original.color).lerp(white, 0.2);
        }
        for (const mesh of entry.meshes) mesh.material = material;
      }
    },
  };
}
