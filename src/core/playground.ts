import { ACESFilmicToneMapping, Box3, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Renderer, WebGPUBackend, StandardNodeLibrary, Vector3 } from 'three/webgpu';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CharacterDefinition, CharacterParameters } from '../characters/types';
import { createLighting } from './lighting';
import { bindInput } from './input';
import { createMovementConstraint, frameCharacter } from './stage';

export interface Playground {
  poke(): void;
  reset(): void;
  setParameters(parameters: Partial<CharacterParameters>): void;
  dispose(): void;
}

export async function createPlayground(host: HTMLElement, definition: CharacterDefinition, callbacks: { onStatus(value: string): void; onFps(value: number): void }): Promise<Playground> {
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
  camera.position.set(...(definition.camera?.position ?? [0, 5.7, 10.1]));
  camera.lookAt(...(definition.camera?.target ?? [0, 1.35, 0]));
  const lighting = createLighting(scene);
  const environment = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(environment, .04);
  scene.environment = envMap.texture;
  scene.environmentIntensity = .3;
  environment.dispose(); pmrem.dispose();
  const character = definition.create();
  scene.add(character.object);
  const restingBounds = new Box3().setFromObject(character.object, true);
  const restingTransform = character.object.matrixWorld.clone();
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', `${definition.name}，按住按压，拖动拉伸，空格弹跳`);
  canvas.setAttribute('role', 'application');
  canvas.dataset.backend = 'WebGPU';
  host.appendChild(canvas);
  const input = bindInput(canvas, camera, character, callbacks.onStatus);
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    input.release();
    renderer.setSize(width, height, false);
    frameCharacter(camera, restingBounds, width, height);
    character.setMovementConstraint(createMovementConstraint(camera, character.object, restingBounds, width, height, restingTransform));
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const shadowPosition = new Vector3();
  let previous = performance.now(), total = 0, frames = 0, elapsed = 0, disposed = false;
  renderer.setAnimationLoop(() => {
    if (disposed) return;
    const now = performance.now();
    const realDt = (now - previous) / 1000;
    const dt = Math.min(realDt, .04); previous = now;
    if (document.hidden) return;
    elapsed += dt;
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
  callbacks.onStatus('今天也可以软软的');
  return {
    setParameters: parameters => character.setParameters(parameters),
    poke() { character.poke(); callbacks.onStatus('啵！烦恼弹走了'); },
    reset() { input.release(); character.reset(); callbacks.onStatus('又是一只蓬松小团子'); },
    dispose() {
      if (disposed) return; disposed = true;
      renderer.setAnimationLoop(null); observer.disconnect(); input.dispose();
      character.dispose(); lighting.dispose(); envMap.dispose(); renderer.dispose(); canvas.remove();
    },
  };
}
