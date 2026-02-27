# Shared Infrastructure

Every game in the arcade plugs into the same set of shared modules. None of this is game-specific — it is the platform the engines run on.

---

## `useGrandkid()` — `app/lib/useGrandkid.ts`

Loads the grandkids list on mount and persists the selected grandkid to `localStorage`. Every game reads `selected.id` when submitting a score and `selected.name` when choosing an animation variant (e.g. Balloon vs Rocket in Hangman).

Returns: `{ grandkids, selected, selectGrandkid, loading, error, refresh }`

---

## `api.ts` — `app/lib/api.ts`

Typed fetch wrapper. Reads `auth_token` from `localStorage` for authenticated requests. `API_BASE` is environment-aware: `/php-api/` in dev (proxied to port 8082), `/grandkid-api/` in production.

| Method | Used by |
|--------|---------|
| `submitScore({ grandkid_id, game_slug, score, completed })` | All games |
| `getRandomWord(difficulty)` | Hangman |
| `getPuzzleImages()` / `getPuzzleImage(id)` | Slide Puzzle, Color Match |
| `getWordSearchThemes()` / `getWordSearchTheme(id)` | Word Search |

---

## `WinBadge.tsx` — `app/components/WinBadge.tsx`

Positioned-absolute overlay rendered inside a `position: relative` wrapper sized to the game board. Props: `visible`, `onClose`, `title`, `celebration` (emoji string), `moves?`, `score?`, `message?`.

All games gate `visible` on a separate `showWinBadge` state rather than directly on `phase`, which allows delayed reveal. Connect-4 uses a 1200ms delay so the overlay does not cover the winning move; all other games show it immediately via `useEffect`.

---

## `FloatingLoveMessages.tsx` — `app/components/FloatingLoveMessages.tsx`

Active while `phase === 'play'`. Fetches personalized messages for the selected grandkid and spawns them every 8–12 seconds, plus emoji decorations every 4 seconds. Controlled by the `loveMessages` and `floatingIcons` settings flags.

---

## Audio — `sounds.ts` (per game)

All games use the Web Audio API directly. Each file exports named functions (`playDrop`, `playWin`, etc.) that synthesize short tones via oscillator/gain nodes. Calls are silently skipped if `isMuted()` returns true. All sound functions return void — they fire and forget with no callback.

---

## Score Submission Guard

All games use an identical `useEffect` pattern to prevent double-submission:

```tsx
useEffect(() => {
  if (phase !== 'done' || scoreSubmitted || !selected) return;
  setScoreSubmitted(true);
  api.submitScore({ grandkid_id: selected.id, game_slug, score, completed: true })
    .catch(() => {});
}, [phase, scoreSubmitted, selected, score]);
```

`scoreSubmitted` resets when a new game starts, not when the WinBadge is closed.

---

## Mounted State

All pages gate animations on a `mounted` boolean:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setMounted(true), 0);
  return () => clearTimeout(t);
}, []);
```

This prevents hydration mismatches and FOUC when the MUI theme reads `localStorage` on first render.

---

## Async Event Notation (Sequence Diagrams)

Throughout the sequence diagrams, spontaneous async events — `useEffect` callbacks and `setTimeout` fires — are shown as `[-> Page` found-message arrows. This is standard UML notation for events with no external caller. They land on an active Page lifeline because Page is always rendering; they are not self-messages from an idle lifeline.
