import type { CharacterDefinition } from './types';
import { createOctoMochi } from './octomochi';

export const characters: CharacterDefinition[] = [{
  id: 'octomochi',
  name: '糯糯八爪鱼',
  englishName: 'OctoMochi',
  color: '#c6a0df',
  defaults: { color: '#c6a0df', stiffness: 0.48, damping: 0.42 },
  create: createOctoMochi,
}];
