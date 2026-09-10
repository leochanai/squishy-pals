import { Color, DoubleSide, Mesh, type Group, type Material, type MeshPhysicalNodeMaterial } from 'three/webgpu';
import { diffuseColor, luminance, mix, output, vec4 } from 'three/tsl';
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
            material.metalness = 0; material.roughness = 0.08;
            material.clearcoat = 0.55; material.clearcoatRoughness = 0.12;
            material.transmission = 0.96; material.thickness = entry.thickness * 0.65;
            // Draw both shell surfaces so the far contour remains visible through the front.
            material.side = DoubleSide; material.transparent = true; material.opacity = 0.78;
            material.forceSinglePass = false;
            // Keep refraction detail, but anchor its hue to the user's selected pigment.
            // A green stage must not turn every transparent character green.
            const shade = luminance(output.rgb).div(luminance(diffuseColor.rgb).max(0.08)).min(2);
            material.outputNode = vec4(mix(output.rgb, diffuseColor.rgb.mul(shade), 0.88), output.a);
            material.ior = 1.18; material.attenuationDistance = 6;
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
          material.attenuationColor.copy(entry.original.color).lerp(white, 0.55);
        }
        for (const mesh of entry.meshes) mesh.material = material;
      }
    },
  };
}
