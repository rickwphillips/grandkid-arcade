import type {
  Grandkid,
  CreateGrandkidInput,
  UpdateGrandkidInput,
  GamePlay,
  SubmitScoreInput,
  Favorite,
  ToggleFavoriteInput,
  PuzzleImage,
  PuzzleImageWithData,
  LoveMessage,
  HangmanWord,
  WordSearchTheme,
  WordSearchThemeWithWords,
  WordSearchWord,
} from './types';
import { clearToken, getToken, redirectToLogin } from './auth';

// API base URL — environment-aware
// Dev: proxied via Next.js rewrites to localhost:8082
// Prod: deployed to ~/public_html/grandkid-api/
const isDev = process.env.NODE_ENV === 'development';
export const API_BASE = isDev ? '/php-api/' : '/grandkid-api/';

// Asset base path — Next.js basePath is NOT auto-prepended to src="" attributes
// Must be prepended manually for any public/ assets referenced in code
export const ASSET_BASE = isDev ? '' : '/app/projects/grandkid-games';

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function signOutToLogin() {
  if (typeof window === 'undefined') return;
  clearToken();
  redirectToLogin();
}

// Helper for API calls
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Strip leading slash to avoid double-slash with API_BASE
  const clean = endpoint.replace(/^\//, '');

  // Handle query strings properly — insert .php before the query string
  let url: string;
  if (clean.includes('?')) {
    const [path, query] = clean.split('?');
    url = `${API_BASE}${path}.php?${query}`;
  } else {
    url = `${API_BASE}${clean}.php`;
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    signOutToLogin();
    throw new Error('Authentication required');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Typed API methods
export const api = {
  // Grandkids
  getGrandkids: () => apiFetch<Grandkid[]>('/grandkids'),
  getGrandkid: (id: number) => apiFetch<Grandkid>(`/grandkids?id=${id}`),
  createGrandkid: (data: CreateGrandkidInput) =>
    apiFetch<Grandkid>('/grandkids', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGrandkid: (id: number, data: UpdateGrandkidInput) =>
    apiFetch<{ success: boolean }>(`/grandkids?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGrandkid: (id: number) =>
    apiFetch<{ success: boolean }>(`/grandkids?id=${id}`, { method: 'DELETE' }),

  // Scores
  getScores: (grandkidId?: number, gameSlug?: string) => {
    const params: string[] = [];
    if (grandkidId) params.push(`grandkid_id=${grandkidId}`);
    if (gameSlug) params.push(`game_slug=${encodeURIComponent(gameSlug)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return apiFetch<GamePlay[]>(`/scores${query}`);
  },
  submitScore: (data: SubmitScoreInput) =>
    apiFetch<GamePlay>('/scores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Favorites
  getFavorites: (grandkidId: number) =>
    apiFetch<Favorite[]>(`/favorites?grandkid_id=${grandkidId}`),
  toggleFavorite: (data: ToggleFavoriteInput) =>
    apiFetch<{ favorited: boolean }>('/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Puzzle images
  getPuzzleImages: () => apiFetch<PuzzleImage[]>('/puzzle-images'),
  getPuzzleImage: (id: number) => apiFetch<PuzzleImageWithData>(`/puzzle-images?id=${id}`),
  createPuzzleImage: (data: { title: string; image_data: string }) =>
    apiFetch<PuzzleImage>('/puzzle-images', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePuzzleImage: (id: number) =>
    apiFetch<{ success: boolean }>(`/puzzle-images?id=${id}`, { method: 'DELETE' }),

  // Love messages
  getLoveMessages: (name?: string) =>
    apiFetch<LoveMessage[]>(name ? `/love-messages?name=${encodeURIComponent(name)}` : '/love-messages'),

  // Hangman words
  getRandomWord: (difficulty: string) =>
    apiFetch<HangmanWord>(`/hangman-words?difficulty=${encodeURIComponent(difficulty)}&random=1`),
  getHangmanWords: () => apiFetch<HangmanWord[]>('/hangman-words'),
  createHangmanWord: (data: { word: string; hint?: string; difficulty: string }) =>
    apiFetch<{ success: boolean; id: number }>('/hangman-words', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteHangmanWord: (id: number) =>
    apiFetch<{ success: boolean }>(`/hangman-words?id=${id}`, { method: 'DELETE' }),

  // Word Search themes
  getWordSearchThemes: () => apiFetch<WordSearchTheme[]>('/word-search-themes'),
  getWordSearchTheme: (id: number) =>
    apiFetch<WordSearchThemeWithWords>(`/word-search-themes?id=${id}`),
  createWordSearchTheme: (data: { title: string; difficulty: string; emoji: string; description?: string }) =>
    apiFetch<WordSearchTheme>('/word-search-themes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWordSearchTheme: (id: number) =>
    apiFetch<{ success: boolean }>(`/word-search-themes?id=${id}`, { method: 'DELETE' }),
  addWordSearchWord: (themeId: number, word: string) =>
    apiFetch<WordSearchWord>(`/word-search-themes?id=${themeId}&words=1`, {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),
  deleteWordSearchWord: (wordId: number) =>
    apiFetch<{ success: boolean }>(`/word-search-themes?word_id=${wordId}`, { method: 'DELETE' }),
};
