'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import PlaygroundPage from '@/src/core/PlaygroundPage';
import { characters } from '@/src/characters/registry';

// Keep the canvas above the dynamic [id] page so navigation preserves WebGPU.
export default function PalsLayout({ children }: { children: ReactNode }) {
  const id = usePathname().match(/^\/pals\/([^/]+)\/?$/)?.[1];
  const character = characters.find(item => item.id === id);
  return <>{character && <PlaygroundPage characterId={character.id} />}{children}</>;
}
