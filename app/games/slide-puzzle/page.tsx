'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ImageIcon from '@mui/icons-material/Image';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import { WinBadge } from '@/app/components/WinBadge';
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
  solvePuzzle,
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

/** Max board size in pixels (scales down on small screens) */
const BOARD_MAX = 400;
/** Reference image size */
const REF_SIZE = 120;

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
  const [solving, setSolving] = useState(false);
  const [autoSolved, setAutoSolved] = useState(false);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [solveError, setSolveError] = useState(false);
  const solveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const solveCancelledRef = useRef(false);

  // Phase 3: Win state
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const emptyValue = gridSize * gridSize - 1;
  const tilePct = 100 / gridSize;

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

  // Show win badge when entering win phase
  useEffect(() => {
    if (phase === 'win') setShowWinBadge(true);
  }, [phase]);

  // Clean up solve animation on unmount
  useEffect(() => {
    return () => {
      if (solveTimerRef.current) clearInterval(solveTimerRef.current);
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
      setShowHint(false);
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
      if (phase !== 'play' || solving) return;
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
    [board, gridSize, phase, solving],
  );

  // Auto-solve: compute solution and animate moves
  const handleSolve = useCallback(() => {
    solveCancelledRef.current = false;
    setSolving(true);
    setAutoSolved(true);

    // Defer computation to let React render "Solving…" state
    setTimeout(() => {
      if (solveCancelledRef.current) return;

      const solution = solvePuzzle(board, gridSize);
      if (solveCancelledRef.current) return;

      if (!solution || solution.length === 0) {
        setSolving(false);
        setAutoSolved(false);
        if (!solution) setSolveError(true);
        return;
      }

      let step = 0;
      solveTimerRef.current = setInterval(() => {
        const idx = solution[step];
        playSlide();
        setBoard((prev) => moveTile(prev, gridSize, idx) ?? prev);
        setMoves((m) => m + 1);
        step++;

        if (step >= solution.length) {
          if (solveTimerRef.current) clearInterval(solveTimerRef.current);
          solveTimerRef.current = null;
          setTimeout(() => {
            setSolving(false);
            setPhase('win');
            playWin();
          }, 300);
        }
      }, 250);
    }, 50);
  }, [board, gridSize]);

  // Cancel an in-progress solve so the user can resume manually
  const handleCancelSolve = useCallback(() => {
    solveCancelledRef.current = true;
    if (solveTimerRef.current) {
      clearInterval(solveTimerRef.current);
      solveTimerRef.current = null;
    }
    setSolving(false);
    setAutoSolved(false);
  }, []);

  // Submit score on win
  useEffect(() => {
    if (phase !== 'win' || scoreSubmitted || !selected || autoSolved) return;
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
  }, [phase, scoreSubmitted, selected, moves, gridSize, autoSolved]);

  // Play again: same image, re-shuffle
  const playAgain = useCallback(() => {
    if (solveTimerRef.current) { clearInterval(solveTimerRef.current); solveTimerRef.current = null; }
    setBoard(generateBoard(gridSize));
    setMoves(0);
    setScoreSubmitted(false);
    setShowHint(false);
    setSolving(false);
    setAutoSolved(false);
    setShowWinBadge(false);
    setPhase('play');
  }, [gridSize]);

  // New image: back to selection
  const newImage = useCallback(() => {
    if (solveTimerRef.current) { clearInterval(solveTimerRef.current); solveTimerRef.current = null; }
    setPhase('select');
    setImageDataUri('');
    setBoard([]);
    setMoves(0);
    setScoreSubmitted(false);
    setShowHint(false);
    setSolving(false);
    setAutoSolved(false);
    setShowWinBadge(false);
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
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControl sx={{ minWidth: 240 }}>
                  <InputLabel id="puzzle-image-label">Choose an image</InputLabel>
                  <Select
                    labelId="puzzle-image-label"
                    value={selectedImageId ?? ''}
                    label="Choose an image"
                    onChange={(e) => setSelectedImageId(e.target.value as number)}
                  >
                    {images.map((img) => (
                      <MenuItem key={img.id} value={img.id}>
                        {img.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            <Button size="small" variant="outlined" startIcon={<ShuffleIcon />} onClick={playAgain} disabled={solving}>
              Re-scramble
            </Button>
          )}
        </Box>

        {/* Board + reference */}
        <Box className={styles.boardWrapper}>
          {/* Board container (relative for win overlay) */}
          <Box sx={{ position: 'relative', width: '100%', maxWidth: BOARD_MAX }}>
            <Box
              className={styles.board}
              sx={{
                width: '100%',
                aspectRatio: '1',
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
                      width: `${tilePct}%`,
                      height: `${tilePct}%`,
                      top: `${currentRow * tilePct}%`,
                      left: `${currentCol * tilePct}%`,
                      backgroundImage: `url(${imageDataUri})`,
                      backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                      backgroundPosition: `${(tile.homeCol / (gridSize - 1)) * 100}% ${(tile.homeRow / (gridSize - 1)) * 100}%`,
                    }}
                  />
                );
              })}
            </Box>

            <WinBadge
              visible={phase === 'win' && showWinBadge}
              onClose={() => setShowWinBadge(false)}
              title="Puzzle Complete!"
              celebration="🎉🧩🎉"
              moves={moves}
              score={score}
              message={
                autoSolved
                  ? 'Auto-solved — no score recorded'
                  : selected && scoreSubmitted
                    ? `Score saved for ${selected.name}!`
                    : undefined
              }
            />
          </Box>

          {/* Side column: hint/solve during play, view results toggle on win */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {phase === 'play' && (
              <>
                {gridSize < 6 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={showHint ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setShowHint((v) => !v)}
                    disabled={solving}
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
                {showHint && gridSize <= 5 && (
                  <Button
                    size="small"
                    variant="outlined"
                    color={solving ? 'warning' : 'primary'}
                    startIcon={solving ? <CloseIcon /> : <AutoFixHighIcon />}
                    onClick={solving ? handleCancelSolve : handleSolve}
                  >
                    {solving ? 'Cancel' : 'Solve'}
                  </Button>
                )}
              </>
            )}
            {phase === 'win' && !showWinBadge && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EmojiEventsIcon />}
                onClick={() => setShowWinBadge(true)}
              >
                View Results
              </Button>
            )}
          </Box>
        </Box>

        {/* Win action buttons (always accessible below board) */}
        {phase === 'win' && (
          <Box className={styles.actions}>
            <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
              Play Again
            </Button>
            <Button variant="outlined" startIcon={<ImageIcon />} onClick={newImage}>
              New Image
            </Button>
          </Box>
        )}
      </Box>
      </Box>

      <Snackbar
        open={solveError}
        autoHideDuration={4000}
        onClose={() => setSolveError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setSolveError(false)}>
          Sorry, this puzzle is too tricky for me to solve! Try solving a few tiles first.
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
