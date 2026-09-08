import { ACESFilmicToneMapping, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Renderer, WebGPUBackend, StandardNodeLibrary, Vector3 } from 'three/webgpu';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CharacterParameters } from '../characters/types';
import type { RegisteredCharacter } from '../characters/registry';
import { createLighting } from './lighting';
import { bindInput } from './input';
import { createMovementConstraint, frameCharacter } from './stage';
import { createCharacterCache } from './character-cache';

export interface Playground {
  switchCharacter(source: RegisteredCharacter): Promise<boolean>;
  preloadCharacter(source: RegisteredCharacter): Promise<void>;
  poke(): void;
  reset(): void;
  setParameters(parameters: Partial<CharacterParameters>): void;
  dispose(): void;
}

export async function createPlayground(host: HTMLElement, callbacks: { onStatus: (value: string) => void; onFps: (value: number) => void }): Promise<Playground> {
  if (!navigator.gpu) throw new Error('当前环境未提供 WebGPU。');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) throw new Error('当前设备没有可用的 WebGPU 适配器。');
  // Construct the WebGPU backend directly. No fallback backend is registered.
  const renderer = new Renderer(new WebGPUBackend(), { antialias: true, alpha: true, getFallback: null });
  renderer.library = new StandardNodeLibrary();
  try { await renderer.init(); } catch { renderer.dispose(); throw new Error('WebGPU 初始化失败，请检查浏览器硬件加速设置。'); }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(0, 5.7, 10.1); camera.lookAt(0, 1.35, 0);
  const lighting = createLighting(scene);
  const environment = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(environment, .04);
  scene.environment = envMap.texture;
  scene.environmentIntensity = .3;
  environment.dispose(); pmrem.dispose();
  const cache = createCharacterCache(character => renderer.compileAsync(character.object, camera, scene));
  let current: Awaited<ReturnType<typeof cache.prepare>> | null = null;
  let input: ReturnType<typeof bindInput> | null = null;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.dataset.backend = 'WebGPU';
  host.appendChild(canvas);
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    input?.release();
    renderer.setSize(width, height, false);
    if (!current) return;
    frameCharacter(camera, current.bounds, width, height);
    current.character.setMovementConstraint(createMovementConstraint(camera, current.character.object, current.bounds, width, height, current.transform));
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const shadowPosition = new Vector3();
  let previous = performance.now(), total = 0, frames = 0, elapsed = 0, disposed = false;
  await renderer.setAnimationLoop(() => {
    if (disposed || !current) return;
    const now = performance.now();
    const realDt = (now - previous) / 1000;
    const dt = Math.min(realDt, .04); previous = now;
    if (document.hidden) return;
    elapsed += dt;
    const character = current.character;
    character.update(dt, elapsed);
    const diagnostics = character.diagnostics();
    const lift = Number(diagnostics.bodyHeight ?? 0);
    shadowPosition.set(Number(diagnostics.bodyX ?? 0), 0, Number(diagnostics.bodyZ ?? 0));
    character.object.localToWorld(shadowPosition);
    lighting.shadow.position.set(shadowPosition.x, 0, shadowPosition.z);
    lighting.shadow.scale.setScalar(1 + lift * .10);
    lighting.material.opacity = 1 / (1 + lift * .7);
    renderer.render(scene, camera);
    frames++; total += realDt;
    if (total > 1) {
      callbacks.onFps(Math.round(frames / total));
      canvas.dataset.diagnostics = JSON.stringify(diagnostics);
      frames = 0; total = 0;
    }
  });
  return {
    async switchCharacter(source) {
      if (disposed) return false;
      input?.dispose(); input = null;
      callbacks.onStatus(`正在准备${source.name}…`);
      try {
        return await cache.select(source, entry => {
          if (current) scene.remove(current.character.object);
          entry.character.reset();
          entry.character.setParameters(source.defaults);
          current = entry;
          scene.add(entry.character.object);
          camera.position.set(...(source.camera?.position ?? [0, 5.7, 10.1]));
          camera.lookAt(...(source.camera?.target ?? [0, 1.35, 0]));
          camera.updateMatrixWorld(true);
          resize();
          input = bindInput(canvas, camera, entry.character, callbacks.onStatus);
          canvas.setAttribute('aria-label', `${source.name}，按住按压，拖动拉伸，空格弹跳`);
          canvas.dataset.pal = source.id;
          canvas.dataset.diagnostics = JSON.stringify(entry.character.diagnostics());
          previous = performance.now(); elapsed = total = frames = 0;
          callbacks.onStatus('今天也可以软软的');
        });
      } catch (error) {
        if (!disposed && current) input = bindInput(canvas, camera, current.character, callbacks.onStatus);
        throw error;
      }
    },
    async preloadCharacter(source) { await cache.prepare(source); },
    setParameters(parameters) { current?.character.setParameters(parameters); },
    poke() { current?.character.poke(); callbacks.onStatus('啵！烦恼弹走了'); },
    reset() { input?.release(); current?.character.reset(); callbacks.onStatus('又是一只蓬松小团子'); },
    dispose() {
      if (disposed) return; disposed = true;
      void renderer.setAnimationLoop(null); observer.disconnect(); input?.dispose(); canvas.remove();
      // Pending shader compilation still needs the renderer; release it last.
      void cache.dispose().then(() => { scene.clear(); lighting.dispose(); envMap.dispose(); renderer.dispose(); });
    },
  };
}
