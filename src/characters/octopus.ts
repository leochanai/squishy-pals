import { Group } from 'three/webgpu';
import { createOctoMochi } from './octomochi.ts';
import type { Character } from './types';

/** Both skins follow identical gestures and physics; only the visible skin deforms. */
export function createOctopus(): Character {
  const soft = createOctoMochi();
  const machine = createOctoMochi(true);
  const forms = [soft, machine];
  const object = new Group(); object.name = 'OctoMochi';
  object.add(soft.object, machine.object);
  machine.setParameters({ color: '#c6a0df', stiffness: 0.48, damping: 0.42 });
  machine.object.visible = false;
  let active = soft, time = 0;
  return {
    object,
    deformAccessory(point, out) { active.deformAccessory!(point, out); },
    setMovementConstraint(constraint) { forms.forEach(form => form.setMovementConstraint(constraint)); },
    pick(raycaster) { return active.pick(raycaster); },
    beginGrab(hit) { forms.forEach(form => form.beginGrab(hit)); },
    moveGrab(point, drag) { forms.forEach(form => form.moveGrab(point, drag)); },
    endGrab() { forms.forEach(form => form.endGrab()); },
    update(dt, nextTime) { time = nextTime; forms.forEach(form => form.update(dt, time)); },
    poke() { forms.forEach(form => form.poke()); },
    reset() { forms.forEach(form => form.reset()); },
    setParameters(parameters) {
      const { view, ...appearance } = parameters;
      if (view !== undefined) { object.rotation.y = view === 'front' ? 0 : Math.PI / 2; object.updateMatrixWorld(true); }
      forms.forEach(form => form.setParameters(appearance));
      if (parameters.material !== undefined) {
        const next = parameters.material === 'mechanical' ? machine : soft;
        if (next !== active) {
          active.object.visible = false;
          active = next; active.object.visible = true;
          active.update(0, time);
          object.updateMatrixWorld(true);
        }
      }
    },
    diagnostics() { return active.diagnostics(); },
    dispose() { forms.forEach(form => form.dispose()); object.clear(); },
  };
}
