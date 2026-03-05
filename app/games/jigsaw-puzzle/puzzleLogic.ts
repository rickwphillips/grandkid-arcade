export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { rows: number; cols: number; label: string; pieceSize: number; proximity: number }
> = {
  easy:   { rows: 3, cols: 3, label: 'Easy (3×3)',   pieceSize: 130, proximity: 30 },
  medium: { rows: 4, cols: 4, label: 'Medium (4×4)', pieceSize: 100, proximity: 24 },
  hard:   { rows: 5, cols: 5, label: 'Hard (5×5)',   pieceSize: 80,  proximity: 18 },
};

export function defaultDifficultyForAge(age: number): Difficulty {
  if (age <= 7) return 'easy';
  if (age <= 12) return 'medium';
  return 'hard';
}

export interface CoverCropParams {
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
}

/**
 * Compute the cover-crop source rect for drawing an image into a target
 * rectangle at the largest possible scale without stretching or repeating.
 * The cropped region is centered in the source image.
 */
export function computeCoverCrop(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth: number,
  targetHeight: number,
): CoverCropParams {
  const scale = Math.max(targetWidth / naturalWidth, targetHeight / naturalHeight);
  const srcW = targetWidth / scale;
  const srcH = targetHeight / scale;
  const srcX = (naturalWidth - srcW) / 2;
  const srcY = (naturalHeight - srcH) / 2;
  return { srcX, srcY, srcW, srcH };
}
