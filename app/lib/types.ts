// Grandkid
export interface Grandkid {
  id: number;
  name: string;
  age: number;
  interests: string[];
  avatar_color: string;
  created_at: string;
}

export interface CreateGrandkidInput {
  name: string;
  age: number;
  interests?: string[];
  avatar_color?: string;
}

export interface UpdateGrandkidInput {
  name?: string;
  age?: number;
  interests?: string[];
  avatar_color?: string;
}

// Game plays / scores
export interface GamePlay {
  id: number;
  grandkid_id: number;
  game_slug: string;
  score: number;
  completed: boolean;
  played_at: string;
  grandkid_name?: string;
}

export interface SubmitScoreInput {
  grandkid_id: number;
  game_slug: string;
  score: number;
  completed?: boolean;
}

// Favorites
export interface Favorite {
  id: number;
  grandkid_id: number;
  game_slug: string;
  created_at: string;
}

export interface ToggleFavoriteInput {
  grandkid_id: number;
  game_slug: string;
}

// Puzzle images
export interface PuzzleImage {
  id: number;
  title: string;
  created_at: string;
}

export interface PuzzleImageWithData extends PuzzleImage {
  image_data: string;
}
