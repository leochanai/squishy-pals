import type { CharacterDefinition } from './types';

type RegisteredCharacter = Omit<CharacterDefinition, 'create'> & {
  description: string;
  image: string;
  icon: string;
  load(): Promise<CharacterDefinition['create']>;
};

// Metadata stays lightweight; each animal's geometry is loaded only on its play page.
export const characters: RegisteredCharacter[] = [{
  id: 'octomochi',
  name: '糯糯八爪鱼',
  englishName: 'OctoMochi',
  description: '圆滚滚的小脑袋，八只软乎乎的腕足。把烦恼轻轻交给它，再看它慢慢弹回来。',
  image: '/pals/octomochi.png',
  icon: '🐙',
  color: '#c6a0df',
  defaults: { color: '#c6a0df', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./octomochi')).createOctoMochi,
}];
