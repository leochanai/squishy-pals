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
}, {
  id: 'goldmochi',
  name: '摇摇小金鱼',
  englishName: 'GoldMochi',
  description: '圆鼓鼓的小肚子，轻飘飘的扇形尾巴。摸摸鱼鳍，让好心情慢慢游过来。',
  image: '/pals/goldmochi.png',
  icon: '🐠',
  color: '#f5ad52',
  defaults: { color: '#f5ad52', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./goldmochi')).createGoldMochi,
}, {
  id: 'mechaocto',
  name: '咔咔机械八爪鱼',
  englishName: 'MechaOcto',
  description: '金属小脑袋，八只分节机械腕。眨眨黑色小眼睛，陪你弹走一天的疲惫。',
  image: '/pals/mechaocto-black.png',
  icon: '🤖',
  color: '#8eafc7',
  defaults: { color: '#8eafc7', stiffness: 0.78, damping: 0.42 },
  load: async () => (await import('./mechaocto')).createMechaOcto,
}, {
  id: 'whalemochi',
  camera: { position: [0, 3.8, 10.8], target: [0, 1.25, 0] },
  name: '深海小鲸鱼',
  englishName: 'WhaleMochi',
  description: '深海蓝的小身子，宽宽的尾鳍轻轻摇。抱住这份安静，让心情慢慢浮起来。',
  image: '/pals/whalemochi.png',
  icon: '🐋',
  color: '#304b7b',
  defaults: { color: '#304b7b', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./whalemochi')).createWhaleMochi,
}, {
  id: 'sharkmochi',
  camera: { position: [0, 3.8, 10.8], target: [0, 1.3, 0] },
  name: '深海小鲨鱼',
  englishName: 'SharkMochi',
  description: '顶着三角小背鳍，摆摆尾巴游向你。看起来有点酷，捏起来却软乎乎。',
  image: '/pals/sharkmochi.png',
  icon: '🦈',
  color: '#5f7d92',
  defaults: { color: '#5f7d92', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./sharkmochi')).createSharkMochi,
}];
