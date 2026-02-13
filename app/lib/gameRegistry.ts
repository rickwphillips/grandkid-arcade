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
export const games: GameDefinition[] = [];

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.slug === slug);
}

export function getGamesForAge(age: number): GameDefinition[] {
  return games.filter((g) => age >= g.ageRange[0] && age <= g.ageRange[1]);
}
