import { Group, MathUtils, Vector3 } from 'three/webgpu';
import { createOctoMochi } from './octomochi.ts';
import type { Character } from './types';

/** Both skins follow identical gestures and physics; only the visible skin deforms. */
export function createOctopus(): Character {
  const soft = createOctoMochi();
  const machine = createOctoMochi(true);
  const forms = [soft, machine];
  const object = new Group(); object.name = 'OctoMochi';
  object.add(soft.object, machine.object);
  machine.setParameters({ color: '#a9afb0', stiffness: 0.48, damping: 0.42 });
  machine.object.visible = false;
  let active = soft, time = 0, targetHeading = 0;
  let turnGrab: { heading: number; originX: number; target: Vector3; drag: boolean } | null = null;
  return {
    object,
    deformAccessory(point, out) { active.deformAccessory!(point, out); },
    setMovementConstraint(constraint) { forms.forEach(form => form.setMovementConstraint(constraint)); },
    pick(raycaster) { return active.pick(raycaster); },
    beginGrab(hit) {
      turnGrab = hit.handle < 0 ? { heading: object.rotation.y, originX: hit.point.x, target: hit.point.clone(), drag: false } : null;
      targetHeading = object.rotation.y;
      forms.forEach(form => form.beginGrab(hit));
    },
    moveGrab(point, drag) {
      if (turnGrab) {
        turnGrab.target.copy(point); turnGrab.drag = drag;
        if (drag) {
          const distance = point.x - turnGrab.originX;
          const turn = Math.sign(distance) * Math.max(0, Math.abs(distance) - 0.12) * 1.4;
          targetHeading = MathUtils.clamp(turnGrab.heading + turn, -Math.PI / 2, Math.PI / 2);
        }
      }
      forms.forEach(form => form.moveGrab(point, drag));
    },
    endGrab() { turnGrab = null; forms.forEach(form => form.endGrab()); },
    update(dt, nextTime) {
      time = nextTime;
      if (turnGrab?.drag) {
        const difference = Math.atan2(Math.sin(targetHeading - object.rotation.y), Math.cos(targetHeading - object.rotation.y));
        const turn = difference * (1 - Math.exp(-MathUtils.clamp(dt, 0, 0.05) * 8));
        forms.forEach(form => form.rotateGrab(turn));
        object.rotation.y += turn;
        object.updateMatrixWorld(true);
        const target = turnGrab.target;
        forms.forEach(form => form.moveGrab(target, true));
      }
      forms.forEach(form => form.update(dt, time));
    },
    poke() { turnGrab = null; forms.forEach(form => form.poke()); },
    reset() { turnGrab = null; object.rotation.y = targetHeading = 0; object.updateMatrixWorld(true); forms.forEach(form => form.reset()); },
    setParameters(parameters) {
      const { view, ...appearance } = parameters;
      if (view !== undefined) { object.rotation.y = targetHeading = view === 'front' ? 0 : Math.PI / 2; object.updateMatrixWorld(true); }
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
