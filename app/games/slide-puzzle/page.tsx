'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageIcon from '@mui/icons-material/Image';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import type { PuzzleImage } from '@/app/lib/types';
import {
  generateBoard,
  tileFromValue,
  moveTile,
  isSolved,
  calcScore,
} from './puzzleLogic';
import { playSlide, playWin } from './sounds';
import styles from './page.module.scss';

type Phase = 'select' | 'play' | 'win';
type GridSize = 3 | 4 | 5 | 6;

const GRID_LABELS: Record<GridSize, string> = {
  3: '3×3 Easy',
  4: '4×4 Medium',
  5: '5×5 Hard',
  6: '6×6 Xtra Hard',
};

/** Board pixel size */
const BOARD_SIZE = 400;
/** Reference image size */
const REF_SIZE = 150;

function defaultGridForAge(age: number): GridSize {
  if (age <= 7) return 3;
  if (age <= 12) return 4;
  return 5;
}

export default function SlidePuzzlePage() {
  const { mode } = useThemeMode();
  const { selected } = useGrandkid();

  // Phase 1: Selection state
  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(4);

  // Phase 2: Gameplay state
  const [phase, setPhase] = useState<Phase>('select');
  const [imageDataUri, setImageDataUri] = useState<string>('');
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [starting, setStarting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Phase 3: Win state
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const emptyValue = gridSize * gridSize - 1;
  const tileSize = BOARD_SIZE / gridSize;

  // Set default grid size based on grandkid age
  useEffect(() => {
    if (selected) {
      setGridSize(defaultGridForAge(selected.age));
    }
  }, [selected]);

  // Fetch image list
  useEffect(() => {
    let cancelled = false;
    api
      .getPuzzleImages()
      .then((list) => {
        if (!cancelled) {
          setImages(list);
          if (list.length > 0) setSelectedImageId(list[0].id);
        }
      })
      .catch(() => {
        // Non-critical; user can retry
      })
      .finally(() => {
        if (!cancelled) setLoadingImages(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Start game: fetch full image and generate board
  const handleStart = useCallback(async () => {
    if (!selectedImageId) return;
    setStarting(true);
    try {
      const img = await api.getPuzzleImage(selectedImageId);
      setImageDataUri(img.image_data);
      setBoard(generateBoard(gridSize));
      setMoves(0);
      setScoreSubmitted(false);
      setShowHint(gridSize === 3);
      setPhase('play');
    } catch {
      // Could show an error; for now just stop loading
    } finally {
      setStarting(false);
    }
  }, [selectedImageId, gridSize]);

  // Handle tile click
  const handleTileClick = useCallback(
    (index: number) => {
      if (phase !== 'play') return;
      const newBoard = moveTile(board, gridSize, index);
      if (!newBoard) return;

      playSlide();
      setBoard(newBoard);
      setMoves((m) => m + 1);

      if (isSolved(newBoard)) {
        setPhase('win');
        playWin();
      }
    },
    [board, gridSize, phase],
  );

  // Submit score on win
  useEffect(() => {
    if (phase !== 'win' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    const score = calcScore(moves, gridSize);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'slide-puzzle',
        score,
        completed: true,
      })
      .catch(() => {
        // Non-critical
      });
  }, [phase, scoreSubmitted, selected, moves, gridSize]);

  // Play again: same image, re-shuffle
  const playAgain = useCallback(() => {
    setBoard(generateBoard(gridSize));
    setMoves(0);
    setScoreSubmitted(false);
    setShowHint(gridSize === 3);
    setPhase('play');
  }, [gridSize]);

  // New image: back to selection
  const newImage = useCallback(() => {
    setPhase('select');
    setImageDataUri('');
    setBoard([]);
    setMoves(0);
    setScoreSubmitted(false);
    setShowHint(false);
  }, []);

  const score = useMemo(
    () => (moves > 0 ? calcScore(moves, gridSize) : 0),
    [moves, gridSize],
  );

  // --- Phase 1: Selection ---
  if (phase === 'select') {
    return (
      <PageContainer title="Slide Puzzle" subtitle="Pick an image and difficulty!">
        <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
          {loadingImages ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : images.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No puzzle images available yet. Ask an admin to upload some!
            </Typography>
          ) : (
            <>
              {/* Image selection */}
              <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
                Choose an image
              </Typography>
              <Box className={styles.selectionGrid}>
                {images.map((img) => (
                  <Box
                    key={img.id}
                    className={`${styles.imageChip} ${selectedImageId === img.id ? styles.imageChipSelected : ''}`}
                    onClick={() => setSelectedImageId(img.id)}
                    sx={{
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)',
                      color: 'text.primary',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', opacity: 0.7 }} />
                    {img.title}
                  </Box>
                ))}
              </Box>

              {/* Difficulty selection */}
              <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 3, mb: 1, fontWeight: 600 }}>
                Difficulty
              </Typography>
              <Box className={styles.difficultyRow}>
                {([3, 4, 5, 6] as GridSize[]).map((size) => (
                  <Chip
                    key={size}
                    label={GRID_LABELS[size]}
                    variant={gridSize === size ? 'filled' : 'outlined'}
                    color={gridSize === size ? 'primary' : 'default'}
                    onClick={() => setGridSize(size)}
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                ))}
              </Box>

              {/* Start button */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStart}
                  disabled={!selectedImageId || starting}
                  startIcon={starting ? <CircularProgress size={20} color="inherit" /> : undefined}
                  sx={{ px: 5, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {starting ? 'Loading…' : 'Start!'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </PageContainer>
    );
  }

  // --- Phase 2 & 3: Gameplay / Win ---
  return (
    <PageContainer title="Slide Puzzle" subtitle="Slide tiles to rebuild the image!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
      <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
        {/* Move counter + re-scramble */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Moves: {moves}
          </Typography>
          {phase === 'play' && (
            <Button size="small" variant="outlined" startIcon={<ShuffleIcon />} onClick={playAgain}>
              Re-scramble
            </Button>
          )}
        </Box>

        {/* Board + reference */}
        <Box className={styles.boardWrapper}>
          {/* Puzzle board */}
          <Box
            className={styles.board}
            sx={{
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(0,0,0,0.1)',
            }}
          >
            {board.map((value, index) => {
              if (value === emptyValue) return null;

              const tile = tileFromValue(value, gridSize);
              const currentRow = Math.floor(index / gridSize);
              const currentCol = index % gridSize;

              return (
                <Box
                  key={value}
                  className={styles.tile}
                  onClick={() => handleTileClick(index)}
                  sx={{
                    width: tileSize,
                    height: tileSize,
                    top: currentRow * tileSize,
                    left: currentCol * tileSize,
                    backgroundImage: `url(${imageDataUri})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${(tile.homeCol / (gridSize - 1)) * 100}% ${(tile.homeRow / (gridSize - 1)) * 100}%`,
                  }}
                />
              );
            })}
          </Box>

          {/* Hint toggle + reference image (disabled on 6×6) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {gridSize < 6 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={showHint ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={() => setShowHint((v) => !v)}
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            )}
            {showHint && (
              <Box
                className={styles.reference}
                component="img"
                src={imageDataUri}
                alt="Reference"
                sx={{
                  width: REF_SIZE,
                  height: REF_SIZE,
                  objectFit: 'cover',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      </Box>

      {/* Win screen */}
      {phase === 'win' && (
        <Box className={styles.winOverlay}>
          <Box className={styles.celebration}>🎉🧩🎉</Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Puzzle Complete!
          </Typography>

          <Box className={styles.statsRow}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {moves}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Moves
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEventsIcon sx={{ fontSize: 28, color: '#DAA520', verticalAlign: 'middle' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {score}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Score
              </Typography>
            </Box>
          </Box>

          {selected && scoreSubmitted && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Score saved for {selected.name}!
            </Typography>
          )}

          <Box className={styles.actions}>
            <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
              Play Again
            </Button>
            <Button variant="outlined" startIcon={<ImageIcon />} onClick={newImage}>
              New Image
            </Button>
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
