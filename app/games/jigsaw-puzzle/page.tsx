'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ImageIcon from '@mui/icons-material/Image';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { JigsawPuzzle } from 'react-jigsaw-puzzle/lib';
import 'react-jigsaw-puzzle/lib/jigsaw-puzzle.css';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import type { PuzzleImage } from '@/app/lib/types';
import styles from './page.module.scss';

type Phase = 'select' | 'play' | 'win';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; label: string }> = {
  easy:   { rows: 3, cols: 3, label: 'Easy (3×3)' },
  medium: { rows: 4, cols: 4, label: 'Medium (4×4)' },
  hard:   { rows: 5, cols: 5, label: 'Hard (5×5)' },
};

function defaultDifficultyForAge(age: number): Difficulty {
  if (age <= 7) return 'easy';
  if (age <= 12) return 'medium';
  return 'hard';
}

export default function JigsawPuzzlePage() {
  const { mode } = useThemeMode();
  const { selected } = useGrandkid();

  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [phase, setPhase] = useState<Phase>('select');
  const [imageDataUri, setImageDataUri] = useState<string>('');
  const [starting, setStarting] = useState(false);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    if (selected) {
      setDifficulty(defaultDifficultyForAge(selected.age));
    }
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    api
      .getPuzzleImages()
      .then((list) => {
        if (!cancelled) {
          setImages(list);
          if (list.length > 0) setSelectedImageId(list[Math.floor(Math.random() * list.length)].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingImages(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedImageId) return;
    setStarting(true);
    try {
      const img = await api.getPuzzleImage(selectedImageId);
      setImageDataUri(img.image_data);
      setScoreSubmitted(false);
      setShowWinBadge(false);
      setPhase('play');
    } catch {
      // Non-critical
    } finally {
      setStarting(false);
    }
  }, [selectedImageId]);

  const handleSolved = useCallback(() => {
    setTimeout(() => {
      setPhase('win');
      setShowWinBadge(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (phase !== 'win' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'jigsaw-puzzle',
        score: 100,
        completed: true,
      })
      .catch(() => {});
  }, [phase, scoreSubmitted, selected]);

  const playAgain = useCallback(() => {
    setShowWinBadge(false);
    setScoreSubmitted(false);
    setPhase('play');
  }, []);

  const newImage = useCallback(() => {
    setPhase('select');
    setImageDataUri('');
    setShowWinBadge(false);
    setScoreSubmitted(false);
  }, []);

  // --- Selection phase ---
  if (phase === 'select') {
    return (
      <PageContainer title="Jigsaw Puzzle" subtitle="Pick an image and put it together!">
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
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <FormControl sx={{ minWidth: 240 }}>
                  <InputLabel id="jigsaw-image-label">Choose an image</InputLabel>
                  <Select
                    labelId="jigsaw-image-label"
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

              <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 3, mb: 1, fontWeight: 600 }}>
                Difficulty
              </Typography>
              <Box className={styles.difficultyRow}>
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => (
                  <Chip
                    key={key}
                    label={DIFFICULTY_CONFIG[key].label}
                    variant={difficulty === key ? 'filled' : 'outlined'}
                    color={difficulty === key ? 'primary' : 'default'}
                    onClick={() => setDifficulty(key)}
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                ))}
              </Box>

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

  // --- Play / Win phase ---
  return (
    <PageContainer title="Jigsaw Puzzle" subtitle="Drag pieces into place!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
        <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
          <Box sx={{ position: 'relative' }}>
            <Box className={styles.puzzleWrapper}>
              <JigsawPuzzle
                imageSrc={imageDataUri}
                rows={config.rows}
                columns={config.cols}
                onSolved={handleSolved}
              />
            </Box>
            <WinBadge
              visible={phase === 'win' && showWinBadge}
              onClose={() => setShowWinBadge(false)}
              title="Puzzle Complete!"
              celebration="🧩🎉🧩"
              score={100}
              message={
                selected && scoreSubmitted
                  ? `Score saved for ${selected.name}!`
                  : undefined
              }
            />
          </Box>

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

          {phase === 'win' && !showWinBadge && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EmojiEventsIcon />}
                onClick={() => setShowWinBadge(true)}
              >
                View Results
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
