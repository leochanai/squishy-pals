import type { CharacterDefinition } from './types';

export type RegisteredCharacter = Omit<CharacterDefinition, 'create'> & {
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
  image: '/pals/octomochi-refined.png',
  icon: '🐙',
  color: '#c6a0df',
  defaults: { view: 'front', material: 'original', color: '#c6a0df', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./octopus')).createOctopus,
}, {
  id: 'cuttlemochi',
  name: '绵绵小墨鱼',
  englishName: 'CuttleMochi',
  description: '披着波浪小裙边，伸出两只长长的触腕。轻轻拉一拉，陪它一起晃悠悠。',
  image: '/pals/cuttlemochi.png',
  icon: '🦑',
  color: '#9cccbc',
  defaults: { view: 'front', material: 'original', color: '#9cccbc', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./cuttlemochi')).createCuttleMochi,
}, {
  id: 'squidmochi',
  name: '啵啵小鱿鱼',
  englishName: 'SquidMochi',
  description: '尖尖的小尾巴，两片软软的三角鳍。拉长触腕再松手，看它轻快地弹回来。',
  image: '/pals/squidmochi.png',
  icon: '🦑',
  color: '#f69b85',
  defaults: { view: 'front', material: 'original', color: '#f69b85', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./squidmochi')).createSquidMochi,
}, {
  id: 'goldmochi',
  camera: { position: [0, 3.8, 9.6], target: [0, 1.4, 0] },
  name: '摇摇小金鱼',
  englishName: 'GoldMochi',
  description: '圆鼓鼓的小肚子，轻飘飘的扇形尾巴。摸摸鱼鳍，让好心情慢慢游过来。',
  image: '/pals/goldmochi.png',
  icon: '🐠',
  color: '#f08610',
  defaults: { view: 'front', material: 'original', color: '#f08610', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./goldmochi')).createGoldMochi,
}, {
  id: 'whalemochi',
  camera: { position: [0, 2.6, 10.8], target: [0, 1.25, 0] },
  name: '深海小鲸鱼',
  englishName: 'WhaleMochi',
  description: '深海蓝的小身子，宽宽的尾鳍轻轻摇。抱住这份安静，让心情慢慢浮起来。',
  image: '/pals/whalemochi.png',
  icon: '🐋',
  color: '#304b7b',
  defaults: { view: 'front', material: 'original', color: '#304b7b', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./whalemochi')).createWhaleMochi,
}, {
  id: 'sharkmochi',
  camera: { position: [0, 2.6, 10.8], target: [0, 1.3, 0] },
  name: '深海小鲨鱼',
  englishName: 'SharkMochi',
  description: '顶着三角小背鳍，摆摆尾巴游向你。看起来有点酷，捏起来却软乎乎。',
  image: '/pals/sharkmochi.png',
  icon: '🦈',
  color: '#5f7d92',
  defaults: { view: 'front', material: 'original', color: '#5f7d92', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./sharkmochi')).createSharkMochi,
}, {
  id: 'sealmochi',
  name: '胖胖小海豹',
  englishName: 'SealMochi',
  description: '趴着的软软身子，短鳍和小胡须轻轻动。戳一下，身体压扁，再轻轻弹回来。',
  image: '/pals/sealmochi.png?v=3',
  icon: '🦭',
  color: '#b9d4df',
  defaults: { view: 'front', material: 'original', color: '#b9d4df', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createSealMochi,
}, {
  id: 'turtlemochi',
  name: '悠悠小海龟',
  englishName: 'TurtleMochi',
  description: '背着圆圆小龟壳，划动四只胖鳍。戳一下，缩起脑袋，再慢慢探出来。',
  image: '/pals/turtlemochi.png?v=4',
  icon: '🐢',
  color: '#8fbe73',
  defaults: { view: 'front', material: 'original', color: '#8fbe73', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createTurtleMochi,
}, {
  id: 'crabmochi',
  name: '夹夹小螃蟹',
  englishName: 'CrabMochi',
  description: '圆圆的钳子，八只短短的小腿。拉拉小钳子，戳一下，举起双钳向你打招呼。',
  image: '/pals/crabmochi.png?v=3',
  icon: '🦀',
  color: '#dc4038',
  defaults: { view: 'front', material: 'original', color: '#dc4038', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createCrabMochi,
}];
