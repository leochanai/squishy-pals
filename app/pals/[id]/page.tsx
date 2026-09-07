import { notFound } from 'next/navigation';
import { characters } from '@/src/characters/registry';
import PlaygroundPage from '@/src/core/PlaygroundPage';

export default async function PalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!characters.some(character => character.id === id)) notFound();
  return <PlaygroundPage initialCharacterId={id} />;
}
