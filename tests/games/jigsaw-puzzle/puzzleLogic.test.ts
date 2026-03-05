import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_CONFIG,
  defaultDifficultyForAge,
  computeCoverCrop,
} from '@/app/games/jigsaw-puzzle/puzzleLogic';

describe('DIFFICULTY_CONFIG', () => {
  it('has entries for easy, medium, and hard', () => {
    expect(DIFFICULTY_CONFIG.easy).toBeDefined();
    expect(DIFFICULTY_CONFIG.medium).toBeDefined();
    expect(DIFFICULTY_CONFIG.hard).toBeDefined();
  });

  it('easy has a larger pieceSize than hard', () => {
    expect(DIFFICULTY_CONFIG.easy.pieceSize).toBeGreaterThan(DIFFICULTY_CONFIG.hard.pieceSize);
  });

  it('easy has a larger proximity than hard', () => {
    expect(DIFFICULTY_CONFIG.easy.proximity).toBeGreaterThan(DIFFICULTY_CONFIG.hard.proximity);
  });

  it('each config has positive rows, cols, pieceSize, and proximity', () => {
    for (const cfg of Object.values(DIFFICULTY_CONFIG)) {
      expect(cfg.rows).toBeGreaterThan(0);
      expect(cfg.cols).toBeGreaterThan(0);
      expect(cfg.pieceSize).toBeGreaterThan(0);
      expect(cfg.proximity).toBeGreaterThan(0);
    }
  });
});

describe('defaultDifficultyForAge', () => {
  it('returns easy for age 3', () => {
    expect(defaultDifficultyForAge(3)).toBe('easy');
  });

  it('returns easy for age 7 (boundary)', () => {
    expect(defaultDifficultyForAge(7)).toBe('easy');
  });

  it('returns medium for age 8', () => {
    expect(defaultDifficultyForAge(8)).toBe('medium');
  });

  it('returns medium for age 12 (boundary)', () => {
    expect(defaultDifficultyForAge(12)).toBe('medium');
  });

  it('returns hard for age 13', () => {
    expect(defaultDifficultyForAge(13)).toBe('hard');
  });

  it('returns hard for age 18', () => {
    expect(defaultDifficultyForAge(18)).toBe('hard');
  });
});

describe('computeCoverCrop', () => {
  it('square image into square target — no crop (srcX/srcY = 0)', () => {
    const result = computeCoverCrop(400, 400, 400, 400);
    expect(result.srcX).toBeCloseTo(0);
    expect(result.srcY).toBeCloseTo(0);
    expect(result.srcW).toBeCloseTo(400);
    expect(result.srcH).toBeCloseTo(400);
  });

  it('landscape image (800×400) into square target (400×400) — crops sides', () => {
    const result = computeCoverCrop(800, 400, 400, 400);
    // scale = max(400/800, 400/400) = 1 → srcH = 400 (full height), srcW = 400
    expect(result.srcH).toBeCloseTo(400);
    expect(result.srcW).toBeCloseTo(400);
    expect(result.srcY).toBeCloseTo(0);
    expect(result.srcX).toBeCloseTo(200); // centered: (800-400)/2
  });

  it('portrait image (400×800) into square target (400×400) — crops top/bottom', () => {
    const result = computeCoverCrop(400, 800, 400, 400);
    expect(result.srcW).toBeCloseTo(400);
    expect(result.srcH).toBeCloseTo(400);
    expect(result.srcX).toBeCloseTo(0);
    expect(result.srcY).toBeCloseTo(200); // centered: (800-400)/2
  });

  it('small image upscaled to larger target — srcX and srcY are 0', () => {
    // 100×100 into 400×400: scale = 4, srcW = 100, srcH = 100, no crop needed
    const result = computeCoverCrop(100, 100, 400, 400);
    expect(result.srcX).toBeCloseTo(0);
    expect(result.srcY).toBeCloseTo(0);
    expect(result.srcW).toBeCloseTo(100);
    expect(result.srcH).toBeCloseTo(100);
  });

  it('maintains aspect ratio: srcW/srcH equals targetWidth/targetHeight', () => {
    const result = computeCoverCrop(1920, 1080, 520, 520);
    expect(result.srcW / result.srcH).toBeCloseTo(1); // target is square
  });

  it('source region fits within the original image bounds', () => {
    const nw = 1200, nh = 800;
    const result = computeCoverCrop(nw, nh, 520, 520);
    expect(result.srcX).toBeGreaterThanOrEqual(0);
    expect(result.srcY).toBeGreaterThanOrEqual(0);
    expect(result.srcX + result.srcW).toBeLessThanOrEqual(nw + 0.001);
    expect(result.srcY + result.srcH).toBeLessThanOrEqual(nh + 0.001);
  });
});
