# Jigsaw Puzzle Engine

**Route**: `app/games/jigsaw-puzzle/`
**Shared infrastructure**: [shared.md](shared.md)

---

## Overview

The Jigsaw Puzzle uses [headbreaker](https://npmjs.com/package/headbreaker) — a canvas-based library that renders true interlocking jigsaw-shaped pieces via [Konva.js](https://konvajs.org/). Pieces are dragged freely on a canvas and snap together automatically when close enough. The puzzle is solved when all pieces form a single connected group.

---

## State Machine

```
select  -->  play  -->  win
```

- **select**: Image and difficulty picker; images loaded on mount from `api.getPuzzleImages()`
- **play**: headbreaker canvas active; pieces are dragged and snapped by the user
- **win**: All pieces connected; score submitted; canvas replaced with full image reveal

---

## Component Map

| File | Purpose |
|------|---------|
| `page.tsx` | Page component, phase state machine, headbreaker lifecycle |
| `puzzleLogic.ts` | Pure logic: `DIFFICULTY_CONFIG`, `defaultDifficultyForAge`, `computeCoverCrop` |
| `page.module.scss` | Polka-dot game area, puzzle container, difficulty row, action buttons |
| `headbreaker.d.ts` | Minimal TypeScript declaration (no `@types/headbreaker` on npm) |

---

## Core Logic — `puzzleLogic.ts`

### `defaultDifficultyForAge(age)`
Returns `'easy'` for age ≤ 7, `'medium'` for age ≤ 12, `'hard'` otherwise. Applied on mount when a grandkid is selected.

### `computeCoverCrop(naturalWidth, naturalHeight, targetWidth, targetHeight)`
Returns `{ srcX, srcY, srcW, srcH }` — the source rectangle to pass to `drawImage` for a cover-crop at the largest possible scale without stretching or repeating. The cropped region is centered in the source image.

**Why this matters**: Konva's `fillPatternImage` tiles by default. If the pre-scaled canvas is smaller than the shuffled layout area, pieces that land outside the image bounds show tiled content. Scaling to `CANVAS_SIZE × CANVAS_SIZE` (520×520) ensures the image covers the full area regardless of where pieces are shuffled.

---

## Difficulty Configuration

| Difficulty | Grid | Piece Size | Proximity |
|------------|------|------------|-----------|
| Easy | 3×3 | 130px | 30px |
| Medium | 4×4 | 100px | 24px |
| Hard | 5×5 | 80px | 18px |

**Proximity** is the snap distance: pieces within this many pixels of their correct position lock together.

---

## Image Pipeline

```
api.getPuzzleImage(id)          → data URI
  → new Image() (onload)
  → computeCoverCrop()          → srcX, srcY, srcW, srcH
  → prescaleImage()             → HTMLCanvasElement (CANVAS_SIZE × CANVAS_SIZE)
  → hb.Canvas({ image: scaledImg })
```

`prescaleImage` produces a `520×520` offscreen canvas. The cover-crop math ensures the image fills the target at the largest possible scale, center-cropped, with no distortion.

Headbreaker uses the canvas as a Konva `fillPatternImage` across all pieces at `scale = 1`. Each piece clips its own region of the global pattern by its position on the canvas.

---

## headbreaker Setup

```ts
const manufacturer = new hb.Manufacturer();
manufacturer.withDimensions(cols, rows);
manufacturer.withHeadAt(hb.anchor(pieceRadius, pieceRadius));

const canvas = new hb.Canvas(PUZZLE_CONTAINER_ID, {
  width: CANVAS_SIZE, height: CANVAS_SIZE,
  pieceSize, proximity,
  borderFill: 2,
  strokeColor, lineSoftness: 0.18,
  image: scaledImg,
  painter: new hb.painters.Konva(),
  fixed: true,              // disables Konva stage panning
  preventOffstageDrag: true,
});

canvas.autogenerateWithManufacturer(manufacturer);
canvas.shuffle(0.85);
canvas.draw();
canvas.attachSolvedValidator();
canvas.onValid((valid) => { if (valid) → setPhase('win') });
```

**`withHeadAt(pieceRadius, pieceRadius)`**: positions the top-left piece center at `(pieceRadius, pieceRadius)` so the puzzle grid starts near the canvas origin and image mapping is correct.

**`lineSoftness: 0.18`**: applies Catmull-Rom spline smoothing to tab/slot curves, giving pieces their organic jigsaw shape.

**`borderFill: 2`**: extends piece shapes 2px beyond cell boundaries, improving tactile snap feel.

---

## Bounds Correction

headbreaker's `preventOffstageDrag` only constrains the piece being directly grabbed — pieces connected in a group that are moved by headbreaker's sync logic bypass Konva's drag constraints and can go off-screen.

A `dragend` handler on the Konva stage corrects this post-drop:

1. Collect all draggable nodes from the Konva layer
2. Cluster them by proximity (`pieceSize × 1.02` center-to-center threshold) — snapped pieces sit exactly `pieceSize` apart, so this threshold separates connected from unconnected pieces
3. Compute a composite bounding box per cluster
4. Apply a single uniform delta to all nodes in each out-of-bounds cluster via `hbPiece.translate(dx, dy)`, keeping headbreaker's internal position model in sync

Using `hbPiece.translate()` (rather than direct Konva `node.x()` writes) is critical — direct position writes leave headbreaker's model stale and break subsequent snap detection.

---

## Win Phase

On win, the Konva canvas is replaced by an `<img>` of the original `imageDataUri` (`object-fit: cover`). This lets the user see the completed image after closing the WinBadge overlay.

Score is always 100 points (fixed) and submitted once per session.

---

## State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `phase` | `'select' \| 'play' \| 'win'` | Game phase |
| `images` | `PuzzleImage[]` | Available puzzle images |
| `selectedImageId` | `number \| null` | Chosen image |
| `difficulty` | `Difficulty` | Active difficulty level |
| `imageDataUri` | `string` | Base64 image data for the puzzle |
| `starting` | `boolean` | Image fetch in progress |
| `showWinBadge` | `boolean` | WinBadge visibility |
| `scoreSubmitted` | `boolean` | Guards against double submission |
| `hbCanvasRef` | `ref<any>` | headbreaker Canvas instance for cleanup |

---

## Known Limitations

- **Drag feel**: Drag interaction is somewhat janky due to headbreaker/Konva's handling of piece groups. Acceptable for the target age range.
- **Group bounds mid-drag**: Bounds correction fires on `dragend`, not during the drag. Groups can temporarily extend past the canvas edge while being dragged; they snap back on release.
- **Proximity clustering**: The `1.02×` threshold can misclassify two unrelated pieces that happen to be within `pieceSize × 1.02` of each other as connected. This is rare in practice but can cause a slight nudge to a nearby unrelated piece on drop.
