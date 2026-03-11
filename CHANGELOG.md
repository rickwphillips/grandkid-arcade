# Changelog

## [1.14.0] - 2026-03-11
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
