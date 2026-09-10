import type { CharacterDefinition, MaterialPreset } from './types';

export type RegisteredCharacter = Omit<CharacterDefinition, 'create'> & {
  description: string;
  image: string;
  icon: string;
  load(): Promise<CharacterDefinition['create']>;
};

export function getDefaultCharacterColor(character: RegisteredCharacter, material: MaterialPreset = character.defaults.material) {
  return character.id === 'octomochi' && material === 'mechanical' ? '#a9afb0' : character.defaults.color;
}

// Metadata stays lightweight; each animal's geometry is loaded only on its play page.
export const characters: RegisteredCharacter[] = [{
  id: 'octomochi',
  name: '糯糯八爪鱼',
  englishName: 'OctoMochi',
  description: '捏圆脑袋 · 松手回弹',
  image: '/pals/octomochi-refined.png',
  icon: '🐙',
  color: '#c6a0df',
  defaults: { view: 'front', material: 'original', color: '#c6a0df', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./octopus')).createOctopus,
}, {
  id: 'cuttlemochi',
  name: '绵绵小墨鱼',
  englishName: 'CuttleMochi',
  description: '拉软触腕 · 软软晃动',
  image: '/pals/cuttlemochi.png',
  icon: '🦑',
  color: '#9cccbc',
  defaults: { view: 'front', material: 'original', color: '#9cccbc', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./cuttlemochi')).createCuttleMochi,
}, {
  id: 'squidmochi',
  name: '啵啵小鱿鱼',
  englishName: 'SquidMochi',
  description: '拉长触腕 · 轻快回弹',
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
  description: '摸摸鱼鳍 · 轻轻摇摆',
  image: '/pals/goldmochi.png',
  icon: '🐠',
  color: '#f08610',
  defaults: { view: 'front', material: 'original', color: '#f08610', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./goldmochi')).createGoldMochi,
}, {
  id: 'clownmochi',
  camera: { position: [0, 3.3, 9.6], target: [0, 1.4, 0] },
  name: '橙橙小丑鱼',
  englishName: 'ClownMochi',
  description: '捏捏条纹 · 摇鳍弹起',
  image: '/pals/clownmochi.png',
  icon: '🐠',
  color: '#f47825',
  defaults: { view: 'front', material: 'original', color: '#f47825', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./clownmochi')).createClownMochi,
}, {
  id: 'whalemochi',
  camera: { position: [0, 2.6, 10.8], target: [0, 1.25, 0] },
  name: '深海小鲸鱼',
  englishName: 'WhaleMochi',
  description: '捏捏肚子 · 宽尾轻摇',
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
  description: '拉拉鱼鳍 · 摇摆尾巴',
  image: '/pals/sharkmochi.png',
  icon: '🦈',
  color: '#5f7d92',
  defaults: { view: 'front', material: 'original', color: '#5f7d92', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./sharkmochi')).createSharkMochi,
}, {
  id: 'sealmochi',
  name: '胖胖小海豹',
  englishName: 'SealMochi',
  description: '戳戳肚子 · 压扁弹起',
  image: '/pals/sealmochi.png?v=3',
  icon: '🦭',
  color: '#b9d4df',
  defaults: { view: 'front', material: 'original', color: '#b9d4df', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createSealMochi,
}, {
  id: 'turtlemochi',
  name: '悠悠小海龟',
  englishName: 'TurtleMochi',
  description: '戳戳龟壳 · 缩头探出',
  image: '/pals/turtlemochi.png?v=4',
  icon: '🐢',
  color: '#8fbe73',
  defaults: { view: 'front', material: 'original', color: '#8fbe73', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createTurtleMochi,
}, {
  id: 'crabmochi',
  name: '夹夹小螃蟹',
  englishName: 'CrabMochi',
  description: '拉拉钳子 · 戳戳举钳',
  image: '/pals/crabmochi.png?v=3',
  icon: '🦀',
  color: '#dc4038',
  defaults: { view: 'front', material: 'original', color: '#dc4038', stiffness: 0.48, damping: 0.42 },
  load: async () => (await import('./coastalmochi')).createCrabMochi,
}];
