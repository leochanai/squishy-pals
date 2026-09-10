import { Camera, Plane, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import type { Character } from '../characters/types';
import type { HandInteraction } from './grab-hand';
import { softenPointer } from './stage';

export function bindInput(canvas: HTMLCanvasElement, camera: Camera, character: Character, onStatus: (value: string) => void, onHand?: (state: HandInteraction) => void) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const point = new Vector3();
  const plane = new Plane();
  let active: number | null = null;
  let hovering = false;
  let originX = 0, originY = 0, dragging = false;
  function ray(event: PointerEvent, resist = false) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    if (resist) pointer.set(softenPointer(pointer.x), softenPointer(pointer.y));
    raycaster.setFromCamera(pointer, camera);
  }
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || active !== null) return;
    ray(event);
    const hit = character.pick(raycaster);
    if (!hit) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    active = event.pointerId; hovering = false;
    originX = event.clientX; originY = event.clientY; dragging = false;
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()), hit.point);
    character.beginGrab(hit);
    character.moveGrab(hit.point, false);
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = onHand ? 'none' : 'grabbing';
    onHand?.({ phase: 'grab', point: hit.point });
    onStatus('正在按压');
  };
  const move = (event: PointerEvent) => {
    if (active === null) {
      if (event.pointerType === 'touch') return;
      hovering = true; ray(event);
      refreshHover();
      return;
    }
    if (event.pointerId !== active) return;
    ray(event, true);
    if (Math.hypot(event.clientX - originX, event.clientY - originY) > 5) dragging = true;
    if (raycaster.ray.intersectPlane(plane, point)) {
      point.y = Math.max(.08, point.y);
      character.moveGrab(point, dragging);
      onHand?.({ phase: 'grab', point });
      if (dragging) onStatus('正在拉伸');
    }
  };
  const release = (event?: PointerEvent) => {
    if (active === null || (event && event.pointerId !== active)) return;
    const id = active; active = null;
    character.endGrab();
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.style.cursor = 'grab';
    onStatus('已松手');
    onHand?.({ phase: 'hidden' });
    if (event?.type === 'pointerup') move(event);
  };
  const key = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement;
    if (event.code !== 'Space' || event.repeat || element.closest('button,input,textarea,select,[role="slider"],[contenteditable]')) return;
    event.preventDefault(); character.poke(); onStatus('戳了一下');
  };
  const refreshHover = () => {
    if (!hovering || active !== null) return;
    raycaster.setFromCamera(pointer, camera);
    const hit = character.pick(raycaster);
    onHand?.(hit ? { phase: 'hover', point: hit.point } : { phase: 'hidden' });
    canvas.style.cursor = hit && onHand ? 'none' : 'grab';
  };
  const leave = () => { hovering = false; if (active === null) { onHand?.({ phase: 'hidden' }); canvas.style.cursor = 'grab'; } };
  const blur = () => { hovering = false; release(); onHand?.({ phase: 'hidden' }); canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  window.addEventListener('keydown', key);
  window.addEventListener('blur', blur);
  return { release: blur, refreshHover, dispose() {
    blur();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
    canvas.removeEventListener('pointerup', release); canvas.removeEventListener('pointercancel', release);
    canvas.removeEventListener('lostpointercapture', release);
    window.removeEventListener('keydown', key); window.removeEventListener('blur', blur);
  } };
}
