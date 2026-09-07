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
}, {
  id: 'cuttlemochi',
  name: '绵绵小墨鱼',
  englishName: 'CuttleMochi',
  description: '披着波浪小裙边，伸出两只长长的触腕。轻轻拉一拉，陪它一起晃悠悠。',
  image: '/pals/cuttlemochi.png',
  icon: '🦑',
  color: '#9cccbc',
  defaults: { color: '#9cccbc', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./cuttlemochi')).createCuttleMochi,
}, {
  id: 'squidmochi',
  name: '啵啵小鱿鱼',
  englishName: 'SquidMochi',
  description: '尖尖的小尾巴，两片软软的三角鳍。拉长触腕再松手，看它轻快地弹回来。',
  image: '/pals/squidmochi.png',
  icon: '🦑',
  color: '#f69b85',
  defaults: { color: '#f69b85', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./squidmochi')).createSquidMochi,
}];
