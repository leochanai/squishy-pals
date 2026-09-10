import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { Box3, Mesh, Vector3 } from 'three/webgpu';
import type { Character } from '../characters/types';
import type { RegisteredCharacter } from '../characters/registry';

/** Retain visited/prepared pals only for the lifetime of this playground. */
export function createCharacterCache(compile: (character: Character) => Promise<void>) {
  async function build(source: RegisteredCharacter) {
    const create = await source.load();
    if (disposed) throw new Error('互动区已关闭');
    const character = create();
    try {
      character.setParameters(source.defaults);
      const bounds = new Box3().setFromObject(character.object, true);
      const transform = character.object.matrixWorld.clone();
      // A box includes large empty corners around curved toys. Retain the actual
      // rest envelope for framing and constraints, including alternate skins.
      const vertices: Vector3[] = [];
      character.object.traverse(child => {
        if (!(child instanceof Mesh)) return;
        const positions = child.geometry.getAttribute('position');
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) vertices.push(new Vector3().fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld));
      });
      const hull = new ConvexGeometry(vertices);
      const hullPositions = hull.getAttribute('position');
      const unique = new Map<string, Vector3>();
      for (let i = 0; i < hullPositions.count; i++) {
        const point = new Vector3().fromBufferAttribute(hullPositions, i);
        unique.set(point.toArray().join(','), point);
      }
      const framingPoints = [...unique.values()];
      hull.dispose();
      await compile(character);
      if (disposed) throw new Error('互动区已关闭');
      return { character, bounds, transform, framingPoints };
    } catch (error) {
      character.dispose();
      throw error;
    }
  }
  const entries = new Map<string, ReturnType<typeof build>>();
  let disposed = false, selection = 0;
  function prepare(source: RegisteredCharacter) {
    if (disposed) return Promise.reject(new Error('互动区已关闭'));
    const cached = entries.get(source.id);
    if (cached) return cached;
    const pending = build(source);
    entries.set(source.id, pending);
    void pending.catch(() => { if (entries.get(source.id) === pending) entries.delete(source.id); });
    return pending;
  }
  return {
    prepare,
    async select(source: RegisteredCharacter, activate: (entry: Awaited<ReturnType<typeof build>>) => void) {
      const request = ++selection;
      try {
        const entry = await prepare(source);
        if (disposed || request !== selection) return false;
        activate(entry);
        return true;
      } catch (error) {
        if (disposed || request !== selection) return false;
        throw error;
      }
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      const results = await Promise.allSettled(entries.values());
      for (const result of results) if (result.status === 'fulfilled') result.value.character.dispose();
      entries.clear();
    },
  };
}
