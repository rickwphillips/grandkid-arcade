# Grandkid Arcade — Game Engine Reference

Each game follows the same outer shell: grandkid selector, `phase` state machine, `WinBadge` overlay, floating love messages, and score submission via `api.submitScore()`. The per-game files below cover the engine-specific logic, data structures, and algorithms. The shared file covers the platform every game builds on.

---

## Games

| Engine | Route | Diagrams |
|--------|-------|---------|
| [Connect-4](engines/connect-4.md) | `app/games/connect-4/` | Components · Sequence |
| [Hangman](engines/hangman.md) | `app/games/hangman/` | Components · Sequence |
| [Slide Puzzle](engines/slide-puzzle.md) | `app/games/slide-puzzle/` | Components · Sequence |
| [Color Match](engines/color-match.md) | `app/games/color-match/` | Components · Sequence |
| [Word Search](engines/word-search.md) | `app/games/word-search/` | Components · Sequence |

## Shared Platform

| Doc | Covers |
|-----|--------|
| [Shared Infrastructure](engines/shared.md) | `useGrandkid`, `api.ts`, `WinBadge`, `FloatingLoveMessages`, audio, score submission guard, mounted state, async event notation |

## Diagrams

All `.puml` source and rendered `.png` files live in `docs/diagrams/`.

| File | Description |
|------|-------------|
| `connect-4-components.png` | Component map for Connect-4 |
| `connect-4-sequence.png` | Full session flow for Connect-4 vs AI |
| `hangman-components.png` | Component map for Hangman |
| `hangman-sequence.png` | Win-path session flow for Hangman |
| `slide-puzzle-components.png` | Component map for Slide Puzzle |
| `slide-puzzle-sequence.png` | Manual play + auto-solve session flow |
| `color-match-components.png` | Component map for Color Match |
| `color-match-sequence.png` | Full session flow for Color Match |
| `word-search-components.png` | Component map for Word Search |
| `word-search-sequence.png` | Grid selection + easy/hard mode session flow |
