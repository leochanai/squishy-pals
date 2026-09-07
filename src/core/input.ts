import { Camera, Plane, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import type { Character } from '../characters/types';
import { softenPointer } from './stage';

export function bindInput(canvas: HTMLCanvasElement, camera: Camera, character: Character, onStatus: (value: string) => void) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const point = new Vector3();
  const plane = new Plane();
  let active: number | null = null;
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
    active = event.pointerId;
    originX = event.clientX; originY = event.clientY; dragging = false;
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()), hit.point);
    character.beginGrab(hit);
    character.moveGrab(hit.point, false);
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
    onStatus('轻轻压，软乎乎');
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== active) return;
    ray(event, true);
    if (Math.hypot(event.clientX - originX, event.clientY - originY) > 5) dragging = true;
    if (raycaster.ray.intersectPlane(plane, point)) {
      point.y = Math.max(.08, point.y);
      character.moveGrab(point, dragging);
      if (dragging) onStatus('哇——轻一点点！');
    }
  };
  const release = (event?: PointerEvent) => {
    if (active === null || (event && event.pointerId !== active)) return;
    const id = active; active = null;
    character.endGrab();
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.style.cursor = 'grab';
    onStatus('呼，慢慢趴好');
  };
  const key = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement;
    if (event.code !== 'Space' || event.repeat || element.closest('button,input,textarea,select,[role="slider"],[contenteditable]')) return;
    event.preventDefault(); character.poke(); onStatus('啵！烦恼弹走了');
  };
  const blur = () => release();
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  window.addEventListener('keydown', key);
  window.addEventListener('blur', blur);
  return { release: blur, dispose() {
    release();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', release); canvas.removeEventListener('pointercancel', release);
    canvas.removeEventListener('lostpointercapture', release);
    window.removeEventListener('keydown', key); window.removeEventListener('blur', blur);
  } };
}
