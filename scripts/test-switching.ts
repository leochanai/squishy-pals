import assert from 'node:assert/strict';
import { Group } from 'three/webgpu';
import type { Character } from '../src/characters/types';
import type { RegisteredCharacter } from '../src/characters/registry';
const { createCharacterCache } = await import(new URL('../src/core/character-cache.ts', import.meta.url).href) as typeof import('../src/core/character-cache');

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function fixture(id: string) {
  const counts = { loads: 0, builds: 0, disposals: 0 };
  const source: RegisteredCharacter = {
    id, name: id, englishName: id, description: '', image: '', icon: '', color: '#fff',
    defaults: { material: 'original', color: '#fff', stiffness: 0.48, damping: 0.42 },
    async load() {
      counts.loads++;
      return () => {
        counts.builds++;
        const object = new Group(); object.name = id;
        const character: Character = {
          object, setMovementConstraint() {}, pick() { return null; }, beginGrab() {}, moveGrab() {}, endGrab() {},
          update() {}, poke() {}, reset() {}, setParameters() {}, diagnostics() { return {}; },
          dispose() { counts.disposals++; },
        };
        return character;
      };
    },
  };
  return { source, counts };
}

// A hover and click share module loading, geometry construction and compilation.
{
  let compilations = 0;
  const cache = createCharacterCache(async () => { compilations++; });
  const { source, counts } = fixture('cached');
  const prepared = cache.prepare(source);
  let selected: Character | undefined;
  assert.equal(await cache.select(source, entry => { selected = entry.character; }), true);
  assert.equal(selected, (await prepared).character);
  for (let i = 0; i < 10; i++) assert.equal(await cache.select(source, entry => { assert.equal(entry.character, selected); }), true);
  assert.deepEqual(counts, { loads: 1, builds: 1, disposals: 0 });
  assert.equal(compilations, 1);
  await cache.dispose(); await cache.dispose();
  assert.equal(counts.disposals, 1);
}

// A slow, superseded selection may be cached, but must never replace the latest one.
{
  const gate = deferred(), started = deferred();
  const cache = createCharacterCache(async character => { if (character.object.name === 'slow') { started.resolve(); await gate.promise; } });
  const slow = fixture('slow'), fast = fixture('fast');
  const activations: string[] = [];
  const activate = (entry: { character: Character }) => { activations.push(entry.character.object.name); };
  const first = cache.select(slow.source, activate);
  await started.promise;
  assert.equal(await cache.select(fast.source, activate), true);
  gate.resolve();
  assert.equal(await first, false);
  assert.deepEqual(activations, ['fast']);
  assert.equal(await cache.select(slow.source, activate), true);
  assert.deepEqual(activations, ['fast', 'slow']);
  assert.equal(slow.counts.builds, 1);
  await cache.dispose();
  assert.equal(slow.counts.disposals, 1); assert.equal(fast.counts.disposals, 1);
}

// Failed preparation is discarded so a retry can succeed without a page reload.
{
  let attempts = 0;
  const cache = createCharacterCache(async () => { if (++attempts === 1) throw new Error('compile failed'); });
  const { source, counts } = fixture('retry');
  await assert.rejects(cache.select(source, () => {}), /compile failed/);
  assert.equal(counts.disposals, 1);
  assert.equal(await cache.select(source, () => {}), true);
  assert.equal(counts.builds, 2);
  await cache.dispose();
  assert.equal(counts.disposals, 2);
}

// Teardown waits for in-flight GPU work and suppresses late scene activation.
{
  const gate = deferred(), started = deferred();
  const cache = createCharacterCache(async () => { started.resolve(); await gate.promise; });
  const { source, counts } = fixture('closing');
  let activated = false, closed = false;
  const selection = cache.select(source, () => { activated = true; });
  await started.promise;
  const closing = cache.dispose().then(() => { closed = true; });
  await Promise.resolve();
  assert.equal(closed, false);
  gate.resolve(); await closing;
  assert.equal(await selection, false); assert.equal(activated, false);
  assert.equal(counts.disposals, 1);
  await assert.rejects(cache.prepare(source), /互动区已关闭/);
}

// Cached real geometry must be reused, including the expensive octopus surface.
for (const [file, factory] of [['octomochi', 'createOctoMochi'], ['whalemochi', 'createWhaleMochi']] as const) {
  const characterModule = await import(new URL(`../src/characters/${file}.ts`, import.meta.url).href);
  const { source } = fixture(file);
  source.load = async () => characterModule[factory];
  const cache = createCharacterCache(async () => {});
  const start = performance.now();
  const first = await cache.prepare(source);
  const cold = performance.now() - start;
  const warmStart = performance.now();
  for (let i = 0; i < 20; i++) assert.equal((await cache.prepare(source)).character, first.character);
  console.log(`${file}: first geometry ${cold.toFixed(1)} ms; cached lookup ${((performance.now() - warmStart) / 20).toFixed(3)} ms (GPU excluded).`);
  await cache.dispose();
}
console.log('Switching passed: shared preload, cache reuse, latest selection, retry and safe teardown.');
