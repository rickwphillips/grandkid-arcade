'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import type { HangmanWord } from '@/app/lib/types';
import {
  MAX_WRONG,
  guessLetter,
  getWrongCount,
  isWon,
  isLost,
  getMaskedWord,
  calcScore,
} from './gameLogic';
import { playCorrect, playWrong, playWin, playLose } from './sounds';
import styles from './page.module.scss';

type Phase = 'select' | 'play' | 'win' | 'lose';

const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  'ZXCVBNM'.split(''),
];

const BALLOON_COLORS = ['🎈', '🟡', '🔵', '🟢', '🟣', '🟠'];
const BALLOON_EMOJIS = ['🎈', '🎈', '🎈', '🎈', '🎈', '🎈'];

// Rocket parts: [emoji, top, left] positioned to form a rocket shape
const ROCKET_PARTS: { label: string; emoji: string; top: number; left: number; flip?: 'x' | 'y' }[] = [
  { label: 'nose', emoji: '🔺', top: 0, left: 42 },
  { label: 'window', emoji: '🪟', top: 30, left: 42 },
  { label: 'body', emoji: '🟦', top: 60, left: 42 },
  { label: 'leftFin', emoji: '📐', top: 80, left: 12, flip: 'x' },
  { label: 'rightFin', emoji: '📐', top: 80, left: 72 },
  { label: 'flame', emoji: '🔥', top: 100, left: 42, flip: 'y' },
];

export default function HangmanPage() {
  const { mode: themeMode } = useThemeMode();
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [currentWord, setCurrentWord] = useState<HangmanWord | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Track which items were just popped/detached for animation
  const [justPopped, setJustPopped] = useState<number | null>(null);

  const wrongCount = currentWord ? getWrongCount(currentWord.word, guessed) : 0;
  const useMasonTheme = selected?.name === 'Mason';

  // Show win badge on win/lose
  useEffect(() => {
    if (phase === 'win' || phase === 'lose') setShowWinBadge(true);
  }, [phase]);

  const fetchWord = useCallback(async (difficulty: string) => {
    setLoading(true);
    setError('');
    try {
      const word = await api.getRandomWord(difficulty);
      setCurrentWord(word);
      setGuessed(new Set());
      setScoreSubmitted(false);
      setShowWinBadge(false);
      setJustPopped(null);
      setPhase('play');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load word');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGuess = useCallback(
    (letter: string) => {
      if (phase !== 'play' || !currentWord) return;
      if (guessed.has(letter)) return;

      const newGuessed = guessLetter(guessed, letter);
      const wordUpper = currentWord.word.toUpperCase();
      const wordLetters = new Set(wordUpper.replace(/[^A-Z]/g, '').split(''));
      const isCorrect = wordLetters.has(letter);

      if (isCorrect) {
        playCorrect();
      } else {
        playWrong();
        // Trigger pop/detach animation on the next piece
        const newWrong = getWrongCount(currentWord.word, newGuessed);
        setJustPopped(newWrong - 1);
      }

      setGuessed(newGuessed);

      // Check win/lose after state update
      if (isWon(currentWord.word, newGuessed)) {
        setTimeout(() => {
          playWin();
          setPhase('win');
        }, 300);
      } else if (isLost(getWrongCount(currentWord.word, newGuessed))) {
        setTimeout(() => {
          playLose();
          setPhase('lose');
        }, 500);
      }
    },
    [phase, currentWord, guessed],
  );

  // Keyboard handler
  useEffect(() => {
    if (phase !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) handleGuess(key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleGuess]);

  // Submit score on win
  useEffect(() => {
    if (phase !== 'win' || scoreSubmitted || !selected || !currentWord) return;
    setScoreSubmitted(true);
    const wordLetterCount = currentWord.word.replace(/[^A-Z]/gi, '').length;
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'hangman',
        score: calcScore(wrongCount, wordLetterCount),
        completed: true,
      })
      .catch(() => {
        // Non-critical
      });
  }, [phase, scoreSubmitted, selected, currentWord, wrongCount]);

  const playAgain = useCallback(() => {
    if (currentWord) fetchWord(currentWord.difficulty);
  }, [currentWord, fetchWord]);

  const newDifficulty = useCallback(() => {
    setPhase('select');
    setCurrentWord(null);
    setGuessed(new Set());
    setScoreSubmitted(false);
    setShowWinBadge(false);
    setJustPopped(null);
  }, []);

  // --- Select phase ---
  if (phase === 'select') {
    return (
      <PageContainer title="Hangman" subtitle="Guess the word letter by letter!">
        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 600, mb: 1 }}>
            Choose difficulty
          </Typography>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box className={styles.difficultySelect}>
            <Button
              variant="contained"
              size="large"
              onClick={() => fetchWord('easy')}
              disabled={loading}
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Easy
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => fetchWord('medium')}
              disabled={loading}
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Medium
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => fetchWord('hard')}
              disabled={loading}
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Hard
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Easy = single words &bull; Medium = short phrases &bull; Hard = long phrases
            </Typography>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  // --- Gameplay + Win/Lose ---
  const masked = currentWord ? getMaskedWord(currentWord.word, guessed) : '';
  const wordLetterCount = currentWord ? currentWord.word.replace(/[^A-Z]/gi, '').length : 0;
  const score = calcScore(wrongCount, wordLetterCount);
  const wordLetters = currentWord
    ? new Set(currentWord.word.toUpperCase().replace(/[^A-Z]/g, '').split(''))
    : new Set<string>();

  return (
    <PageContainer title="Hangman" subtitle="Guess the word letter by letter!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          {/* Wrong count indicator */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Wrong guesses: {wrongCount} / {MAX_WRONG}
            </Typography>
          </Box>

          {/* Animation area */}
          <Box className={styles.animationArea}>
            {useMasonTheme ? (
              <RocketAnimation wrongCount={wrongCount} justPopped={justPopped} />
            ) : (
              <BalloonAnimation wrongCount={wrongCount} justPopped={justPopped} />
            )}
          </Box>

          {/* Word display */}
          <Box className={styles.wordDisplay}>
            {currentWord &&
              currentWord.word
                .toUpperCase()
                .split('')
                .map((ch, i) => {
                  if (ch === ' ') {
                    return <Box key={i} className={styles.wordSpace} />;
                  }
                  const isLetter = /[A-Z]/.test(ch);
                  const revealed = isLetter && guessed.has(ch);
                  const showOnLose = phase === 'lose' && isLetter && !guessed.has(ch);
                  return (
                    <Box
                      key={i}
                      className={`${styles.letterSlot} ${showOnLose ? styles.letterSlotRevealed : ''}`}
                      sx={{
                        borderColor: showOnLose
                          ? 'error.main'
                          : revealed
                            ? 'success.main'
                            : 'text.secondary',
                        color: showOnLose ? 'error.main' : 'text.primary',
                      }}
                    >
                      {revealed || showOnLose ? ch : isLetter ? '\u00A0' : ch}
                    </Box>
                  );
                })}
          </Box>

          {/* Hint */}
          {currentWord?.hint && (
            <Typography variant="body2" color="text.secondary" className={styles.hint}>
              Hint: {currentWord.hint}
            </Typography>
          )}

          {/* Keyboard */}
          {phase === 'play' && (
            <Box className={styles.keyboard}>
              {KEYBOARD_ROWS.map((row, ri) => (
                <Box key={ri} className={styles.keyboardRow}>
                  {row.map((letter) => {
                    const isGuessed = guessed.has(letter);
                    const isCorrect = isGuessed && wordLetters.has(letter);
                    const isWrongGuess = isGuessed && !wordLetters.has(letter);
                    return (
                      <Box
                        key={letter}
                        className={`${styles.key} ${isCorrect ? styles.keyCorrect : ''} ${isWrongGuess ? styles.keyWrong : ''}`}
                        onClick={() => handleGuess(letter)}
                        sx={{
                          bgcolor: isCorrect
                            ? 'success.main'
                            : isWrongGuess
                              ? 'error.main'
                              : (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.04)',
                          color: isCorrect || isWrongGuess ? 'white' : 'text.primary',
                          borderColor: isCorrect
                            ? 'success.main'
                            : isWrongGuess
                              ? 'error.main'
                              : 'divider',
                        }}
                      >
                        {letter}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}

          {/* Win/Lose overlay */}
          <WinBadge
            visible={(phase === 'win' || phase === 'lose') && showWinBadge}
            onClose={() => setShowWinBadge(false)}
            title={phase === 'win' ? 'You got it!' : 'Oh no!'}
            celebration={phase === 'win' ? '🎉🏆🎉' : '😢'}
            score={phase === 'win' ? score : undefined}
            message={
              phase === 'win' && selected && scoreSubmitted
                ? `Score saved for ${selected.name}!`
                : phase === 'lose' && currentWord
                  ? `The word was: ${currentWord.word}`
                  : undefined
            }
          />

          {/* Action buttons */}
          {(phase === 'win' || phase === 'lose') && (
            <Box className={styles.actions}>
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
                Play Again
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={newDifficulty}>
                New Difficulty
              </Button>
            </Box>
          )}

          {/* View Results toggle */}
          {(phase === 'win' || phase === 'lose') && !showWinBadge && (
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

// --- Balloon Animation (Ella-Grace / default) ---
function BalloonAnimation({ wrongCount, justPopped }: { wrongCount: number; justPopped: number | null }) {
  const colors = ['🔴', '🟡', '🔵', '🟢', '🟣', '🟠'];
  return (
    <Box className={styles.balloonContainer}>
      {Array.from({ length: MAX_WRONG }, (_, i) => {
        const isPopped = i < wrongCount;
        const isJustPopped = justPopped === i;
        return (
          <Box
            key={i}
            className={`${styles.balloon} ${isJustPopped ? styles.balloonPopped : ''}`}
            sx={{
              visibility: isPopped && !isJustPopped ? 'hidden' : 'visible',
            }}
          >
            <Box className={styles.balloonBody}>{colors[i]}</Box>
            <Box className={styles.balloonString} />
          </Box>
        );
      })}
    </Box>
  );
}

// --- Rocket Animation (Mason) ---
function RocketAnimation({ wrongCount, justPopped }: { wrongCount: number; justPopped: number | null }) {
  // Parts detach in reverse order: flame first, then fins, body, window, nose
  const detachOrder = [5, 3, 4, 2, 1, 0]; // flame, leftFin, rightFin, body, window, nose

  return (
    <Box className={styles.rocketContainer}>
      {ROCKET_PARTS.map((part, i) => {
        const detachIndex = detachOrder.indexOf(i);
        const isDetached = detachIndex < wrongCount;
        const isJustDetached = justPopped === detachIndex;
        return (
          <Box
            key={part.label}
            className={`${styles.rocketPart} ${isJustDetached ? styles.rocketDetached : ''}`}
            sx={{
              top: part.top,
              left: part.left,
              visibility: isDetached && !isJustDetached ? 'hidden' : 'visible',
              transform: part.flip === 'x' ? 'scaleX(-1)' : part.flip === 'y' ? 'scaleY(-1)' : undefined,
            }}
          >
            {part.emoji}
          </Box>
        );
      })}
    </Box>
  );
}
