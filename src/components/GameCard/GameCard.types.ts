export interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  gameUrl: string;
  category: string;
}

// Define the Props interface that was missing
export interface GameCardProps {
  game: Game;
}