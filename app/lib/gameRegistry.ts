export interface GameDefinition {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  ageRange: [number, number]; // [min, max]
  category: 'puzzle' | 'action' | 'creative' | 'educational';
}

// Central registry of available games.
// Each game gets its own route at app/games/<slug>/page.tsx.
// Add entries here as games are built.
export const games: GameDefinition[] = [
  {
    slug: 'color-match',
    title: 'Color Match',
    description: 'Flip cards and find matching pairs! Train your memory with colorful emojis.',
    emoji: '🃏',
    ageRange: [3, 8],
    category: 'puzzle',
  },
  {
    slug: 'slide-puzzle',
    title: 'Slide Puzzle',
    description: 'Slide the tiles to put the picture back together! A classic brain teaser.',
    emoji: '🧩',
    ageRange: [5, 18],
    category: 'puzzle',
  },
];

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.slug === slug);
}

export function getGamesForAge(age: number): GameDefinition[] {
  return games.filter((g) => age >= g.ageRange[0] && age <= g.ageRange[1]);
}
