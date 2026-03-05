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
    title: 'Picture Matcher',
    description: 'Flip cards and find matching pairs! Match pictures and emojis at three difficulty levels.',
    emoji: '🖼️',
    ageRange: [3, 18],
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
  {
    slug: 'connect-4',
    title: 'Connect 4',
    description: 'Drop pieces to connect four in a row! Play against the computer or a friend.',
    emoji: '🔴',
    ageRange: [4, 18],
    category: 'puzzle',
  },
  {
    slug: 'hangman',
    title: 'Hangman',
    description: 'Guess the word letter by letter!',
    emoji: '🔤',
    ageRange: [5, 18],
    category: 'educational',
  },
  {
    slug: 'word-search',
    title: 'Word Search',
    description: 'Find all the hidden words!',
    emoji: '🔍',
    ageRange: [5, 18],
    category: 'educational',
  },
  {
    slug: 'jigsaw-puzzle',
    title: 'Jigsaw Puzzle',
    description: 'Drag and drop puzzle pieces to rebuild the picture!',
    emoji: '🧩',
    ageRange: [3, 18],
    category: 'puzzle',
  },
];

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.slug === slug);
}

export function getGamesForAge(age: number): GameDefinition[] {
  return games.filter((g) => age >= g.ageRange[0] && age <= g.ageRange[1]);
}
