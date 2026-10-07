# Changelog

## [1.13.3] - 2026-10-07

### Security
- **Next.js 16.3.8** — fixes CVE-2026-94483 (SSRF) and CVE-2026-94484/5/6 (cache poisoning, dev-server MCP endpoint)
- **Dependency CVEs patched** — source-map-js 1.2.2 (GHSA-68fv-2mgg-jv7q), brace-expansion DoS (scoped to minimatch@3.x), js-yaml, sharp, browserslist, @humanfs/node, nanoid, undici, esbuild, vitest
- **PHP API hardening** — grandkid writes gated behind admin, hangman answer key gated, consolidated input validation across endpoints
- Lockfile regenerated so dependency overrides actually resolve; CI now verifies resolved versions match package.json

### Fixed
- Simon Says false game over; Whack-a-Mole stale-timer kill; Jigsaw progress loss on theme toggle
- Whack-a-Mole updaters and Word Search word placement hardened
- Keyboard/ARIA support for Simon Says and Math Flash Cards; a11y and strict difficulty whitelists on admin and grandkid pages

### Changed
- Removed all lint suppressions and explicit `any`; resolved react-hooks/set-state-in-effect errors (shared auth store, external-store theme)
- Added CI (lint, build, test, PHP syntax guard), Dependabot grouped updates, and expanded test coverage

## [1.13.2] - 2026-03-11
### Added
- **Game Card Icons** — custom transparent PNG icons for all 7 games (Picture Matcher, Slide Puzzle, Connect 4, Hangman, Word Search, Math Flash Cards, Simon Says)
  - Generated from high-res originals; white backgrounds removed via corner flood-fill

## [1.13.1] - 2026-03-11
### Added
- **Whack-a-Mole: Golden Mole** — rare (~15% chance) golden mole variant worth 10× points
  - `mole-golden.png` sprite generated from original source, horizontally mirrored
  - Pulsing gold glow animation on active golden moles
  - Gold ring box-shadow on hole when golden mole is present
  - Distinct bell-chime victory sound (`playGoldenWhack`) using triangle waves in B major
  - No two golden moles spawn consecutively

### Changed
- **Whack-a-Mole: Animated mallet cursor** — replaced static CSS cursor with React-tracked mallet
  - 4-frame CSS keyframe swing animation (windup → impact → rebound → rest)
  - Pivot at handle end for realistic arc
  - Direct DOM manipulation for cursor tracking (zero React re-renders on mousemove)
  - Works on touch devices (mallet appears briefly at tap point)
- **Whack-a-Mole: Hit detection** — switched from `onClick` to `onPointerDown` with `touchAction: manipulation` to prevent scroll/gesture cancellation on edge holes
- **Whack-a-Mole: Mole sprite** — replaced 80×44px sprite with larger 200×219px version generated from original high-res source
- **Whack-a-Mole: Holes** — circular holes using `aspectRatio: 1` + `borderRadius: 50%`

## [1.13.0] - 2026-03-10
### Added
- **Whack-a-Mole** game — 9-hole grid, 30-second rounds, 3 difficulty levels
  - Custom mallet cursor with correct hotspot
  - `mole.png` sprite with transparent background
  - Synthesized whack and end-game sounds
  - Score submission, WinBadge with mole + mallet celebration

## [1.12.0] - 2026-03-10
### Added
- **Simon Says** game — color sequence memory, 3 difficulty speeds
  - Classic 4-color button layout (Red/Green/Blue/Yellow)
  - Synthesized tones matching classic Simon frequencies
  - Score submission per round survived

## [1.11.0] - 2026-03-10
### Added
- **Math Flash Cards** game — 10-card rounds, 4-choice answers, 3 difficulty levels
  - Easy: addition ≤10 · Medium: add/subtract ≤20 · Hard: all 4 operations
  - Progress bar, WinBadge, score submission

## [1.10.0] - 2026-03-09
### Changed
- `WinBadge.celebration` prop widened from `string` to `ReactNode`
- `GameCard` supports optional `emojiSrc` image in place of emoji text
