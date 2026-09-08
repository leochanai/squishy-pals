export const accessoryOptions = [
  { id: 'headphones', name: '耳机', slot: 'ears' },
  { id: 'hat', name: '帽子', slot: 'head' },
  { id: 'glasses', name: '眼镜', slot: 'eyes' },
  { id: 'bow', name: '蝴蝶结', slot: 'head' },
] as const;

export type AccessoryId = typeof accessoryOptions[number]['id'];

export function toggleAccessory(current: AccessoryId[], id: AccessoryId): AccessoryId[] {
  if (current.includes(id)) return current.filter(item => item !== id);
  const slot = accessoryOptions.find(item => item.id === id)!.slot;
  return [...current.filter(worn => accessoryOptions.find(item => item.id === worn)!.slot !== slot), id];
}
