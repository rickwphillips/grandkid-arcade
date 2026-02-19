'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import type { WordSearchTheme, WordSearchThemeWithWords } from '@/app/lib/types';
import {
  generateGrid,
  checkSelection,
  getPlacedWordCells,
} from './gameLogic';
import type { Grid } from './gameLogic';
import { playFound, playWin } from './sounds';
import styles from './page.module.scss';

type Phase = 'select' | 'play' | 'done';

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

export default function WordSearchPage() {
  const { mode: themeMode } = useThemeMode();
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [themes, setThemes] = useState<WordSearchTheme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<WordSearchThemeWithWords | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [gridFoundCount, setGridFoundCount] = useState(0); // words found via grid (scored)
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set()); // hard: peeked words
  const [earnedPoints, setEarnedPoints] = useState(0); // running per-word score (excl. bonus)
  const [selStart, setSelStart] = useState<[number, number] | null>(null);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load themes on mount
  useEffect(() => {
    api
      .getWordSearchThemes()
      .then(setThemes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load themes'));
  }, []);

  const handleSelectTheme = useCallback(async (themeId: number) => {
    setLoading(true);
    setError('');
    try {
      const theme = await api.getWordSearchTheme(themeId);
      if (theme.words.length === 0) {
        setError('This theme has no words yet. Ask Grampy to add some!');
        return;
      }
      const words = theme.words.map((w) => w.word);
      const newGrid = generateGrid(words, theme.difficulty);
      if (newGrid.placedWords.length === 0) {
        setError('Could not generate grid. Please try another theme.');
        return;
      }
      setCurrentTheme(theme);
      setGrid(newGrid);
      setFoundWords(new Set());
      setFoundCells(new Set());
      setGridFoundCount(0);
      setRevealedWords(new Set());
      setEarnedPoints(0);
      setSelStart(null);
      setErrorCells(new Set());
      setScore(0);
      setScoreSubmitted(false);
      setShowWinBadge(false);
      setPhase('play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (phase !== 'play' || !grid) return;

      // First click — set selection start
      if (selStart === null) {
        setSelStart([r, c]);
        return;
      }

      // Same cell clicked again — deselect
      if (selStart[0] === r && selStart[1] === c) {
        setSelStart(null);
        return;
      }

      const match = checkSelection(grid, selStart, [r, c]);

      if (match && !foundWords.has(match)) {
        // Found a word via grid — penalise 50% if the player peeked in hard mode
        const wordPoints = currentTheme?.difficulty === 'hard' && revealedWords.has(match) ? 50 : 100;
        const newEarnedPoints = earnedPoints + wordPoints;
        playFound();
        const newFound = new Set(foundWords);
        newFound.add(match);
        setFoundWords(newFound);
        setEarnedPoints(newEarnedPoints);

        const newGridCount = gridFoundCount + 1;
        setGridFoundCount(newGridCount);

        const pw = grid.placedWords.find((p) => p.word === match);
        if (pw) {
          const newFoundCells = new Set(foundCells);
          getPlacedWordCells(pw).forEach((k) => newFoundCells.add(k));
          setFoundCells(newFoundCells);
        }

        setSelStart(null);

        // Check win condition
        if (newFound.size === grid.placedWords.length) {
          const completionBonus = newGridCount === grid.placedWords.length ? 500 : 0;
          const finalScore = newEarnedPoints + completionBonus;
          setScore(finalScore);
          setTimeout(() => {
            playWin();
            setPhase('done');
            setShowWinBadge(true);
          }, 300);
        }
      } else {
        // No match — flash error on both cells, then reset
        const errKeys = new Set<string>();
        errKeys.add(`${selStart[0]},${selStart[1]}`);
        errKeys.add(`${r},${c}`);
        setErrorCells(errKeys);
        setTimeout(() => {
          setErrorCells(new Set());
          setSelStart(null);
        }, 600);
      }
    },
    [phase, grid, currentTheme, selStart, foundWords, foundCells, revealedWords, earnedPoints, gridFoundCount],
  );

  // Hard mode: clicking a hidden word reveals its text (costs 50% of points when found)
  const handleWordHardReveal = useCallback(
    (word: string) => {
      if (phase !== 'play' || currentTheme?.difficulty !== 'hard') return;
      if (foundWords.has(word) || revealedWords.has(word)) return;
      setRevealedWords((prev) => new Set(prev).add(word));
    },
    [phase, currentTheme, foundWords, revealedWords],
  );

  // Easy mode: clicking a word in the list finds it on the grid
  const handleWordListClick = useCallback(
    (word: string) => {
      if (phase !== 'play' || !grid || currentTheme?.difficulty !== 'easy') return;
      if (foundWords.has(word)) return;

      const pw = grid.placedWords.find((p) => p.word === word);
      if (!pw) return;

      playFound();
      const newFound = new Set(foundWords);
      newFound.add(word);
      setFoundWords(newFound);

      const newFoundCells = new Set(foundCells);
      getPlacedWordCells(pw).forEach((k) => newFoundCells.add(k));
      setFoundCells(newFoundCells);
      setSelStart(null);

      if (newFound.size === grid.placedWords.length) {
        // List-tap words score 0; completion bonus only if all found via grid
        const completionBonus = gridFoundCount === grid.placedWords.length ? 500 : 0;
        setScore(earnedPoints + completionBonus);
        setTimeout(() => {
          playWin();
          setPhase('done');
          setShowWinBadge(true);
        }, 300);
      }
    },
    [phase, grid, currentTheme, foundWords, foundCells, gridFoundCount],
  );

  // Submit score when done
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected || !grid) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'word-search',
        score,
        completed: true,
      })
      .catch(() => {
        // Non-critical
      });
  }, [phase, scoreSubmitted, selected, grid, score]);

  const playAgain = useCallback(() => {
    if (currentTheme) handleSelectTheme(currentTheme.id);
  }, [currentTheme, handleSelectTheme]);

  const backToSelect = useCallback(() => {
    setPhase('select');
    setGrid(null);
    setCurrentTheme(null);
    setFoundWords(new Set());
    setFoundCells(new Set());
    setGridFoundCount(0);
    setRevealedWords(new Set());
    setEarnedPoints(0);
    setSelStart(null);
    setErrorCells(new Set());
    setShowWinBadge(false);
  }, []);

  // ── SELECT PHASE ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <PageContainer title="Word Search" subtitle="Find all the hidden words!">
        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 600, mb: 2 }}>
            Choose a theme
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          <Box className={styles.themeGrid}>
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={styles.themeCard}
                onClick={() => !loading && handleSelectTheme(theme.id)}
                sx={{ cursor: loading ? 'default' : 'pointer' }}
              >
                <CardActionArea disabled={loading}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography sx={{ fontSize: '2.5rem', lineHeight: 1, mb: 1 }}>
                      {theme.emoji}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {theme.title}
                    </Typography>
                    <Chip
                      label={theme.difficulty}
                      size="small"
                      color={DIFFICULTY_COLORS[theme.difficulty] || 'default'}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {theme.word_count} words
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      </PageContainer>
    );
  }

  // ── PLAY / DONE PHASE ─────────────────────────────────────────────────────
  if (!grid || !currentTheme) return null;

  return (
    <PageContainer
      title={`${currentTheme.emoji} ${currentTheme.title}`}
      subtitle="Click the first letter, then the last letter of each word!"
    >
      <Box sx={{ position: 'relative' }}>
        {selected && <FloatingLoveMessages name={selected.name} active={phase === 'play'} />}

        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          {/* Progress indicator */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
            Found: {foundWords.size} / {grid.placedWords.length}
          </Typography>

          <Box className={styles.playLayout}>
            {/* Letter grid + win overlay */}
            <Box sx={{ position: 'relative' }}>
              <Box className={styles.gridSection}>
                <Box className={styles.gridWrapper}>
                  {grid.cells.map((row, r) => (
                    <Box key={r} className={styles.gridRow}>
                      {row.map((letter, c) => {
                        const key = `${r},${c}`;
                        const isFound = foundCells.has(key);
                        const isStart = selStart?.[0] === r && selStart?.[1] === c;
                        const isError = errorCells.has(key);
                        return (
                          <Box
                            key={c}
                            className={`${styles.gridCell} ${isFound ? styles.cellFound : ''} ${isStart && !isError ? styles.cellSelected : ''} ${isError ? styles.cellError : ''}`}
                            onClick={() => handleCellClick(r, c)}
                          >
                            {letter}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Win badge — overlays the puzzle */}
              <WinBadge
                visible={phase === 'done' && showWinBadge}
                onClose={() => setShowWinBadge(false)}
                title="You found them all!"
                celebration="🎉🔍🎉"
                score={score}
                message={
                  selected && scoreSubmitted ? `Score saved for ${selected.name}!` : undefined
                }
              />
            </Box>

            {/* Word list */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'center' }}>
              {currentTheme.difficulty === 'easy'
                ? 'Tap a word to find it!'
                : currentTheme.difficulty === 'hard'
                  ? 'Tap a word to reveal it (−50% points)'
                  : 'Words to find:'}
            </Typography>
            <Box className={styles.wordList}>
              {grid.placedWords.map((pw) => {
                const isFound = foundWords.has(pw.word);
                const isEasy = currentTheme.difficulty === 'easy';
                const isHard = currentTheme.difficulty === 'hard';
                const isRevealed = revealedWords.has(pw.word);

                let chipClass = styles.wordItem;
                let onClick: (() => void) | undefined;
                let label: string = pw.word;
                let component: 'button' | 'span' = 'span';

                if (isFound) {
                  chipClass += ` ${styles.wordFound}`;
                } else if (isEasy) {
                  chipClass += ` ${styles.wordItemClickable}`;
                  component = 'button';
                  onClick = () => handleWordListClick(pw.word);
                } else if (isHard) {
                  if (isRevealed) {
                    chipClass += ` ${styles.wordItemRevealed}`;
                  } else {
                    chipClass += ` ${styles.wordItemHidden}`;
                    label = '?'.repeat(pw.word.length);
                    component = 'button';
                    onClick = () => handleWordHardReveal(pw.word);
                  }
                }

                return (
                  <Typography
                    key={pw.word}
                    variant="body2"
                    component={component}
                    className={chipClass}
                    onClick={onClick}
                  >
                    {label}
                  </Typography>
                );
              })}
            </Box>
          </Box>

          {/* Done actions */}
          {phase === 'done' && (
            <Box className={styles.actions}>
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
                Play Again
              </Button>
              <Button variant="outlined" onClick={backToSelect}>
                New Theme
              </Button>
              {!showWinBadge && (
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
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
