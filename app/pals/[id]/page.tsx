import { notFound } from 'next/navigation';
import { characters } from '@/src/characters/registry';

export default async function PalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!characters.some(character => character.id === id)) notFound();
  return null;
}
