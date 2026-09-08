import type { Group, Raycaster, Vector3 } from 'three/webgpu';

export interface CharacterParameters {
  color: string;
  stiffness: number;
  damping: number;
}

export interface GrabHit {
  point: Vector3;
  normal: Vector3;
  part: string;
  /** Character-owned handle. Shared input never interprets it. */
  handle: number;
}

/** Constrains body translation in character-local coordinates, including inertia. */
export type MovementConstraint = (position: Vector3, velocity?: Vector3) => void;

export interface Character {
  object: Group;
  /** Apply the body deformation to an accessory vertex in character-local space. */
  deformAccessory?(point: Vector3, out: Vector3): void;
  setMovementConstraint(constraint: MovementConstraint): void;
  pick(raycaster: Raycaster): GrabHit | null;
  beginGrab(hit: GrabHit): void;
  moveGrab(worldPoint: Vector3, isDrag: boolean): void;
  endGrab(): void;
  update(dt: number, time: number): void;
  poke(): void;
  reset(): void;
  setParameters(parameters: Partial<CharacterParameters>): void;
  dispose(): void;
  diagnostics(): Record<string, number | string | boolean>;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  englishName: string;
  color: string;
  defaults: CharacterParameters;
  camera?: { position: [number, number, number]; target: [number, number, number] };
  create(): Character;
}
