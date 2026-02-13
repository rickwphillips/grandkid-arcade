'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { PageContainer } from '@/app/components/PageContainer';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import { playFlip, playMatch, playMismatch, playWin } from './sounds';
import styles from './page.module.scss';

const EMOJIS = ['🐶', '🐱', '🐸', '🦋', '🌈', '🍎', '🌻', '⭐'];
const TOTAL_PAIRS = EMOJIS.length;

interface CardData {
  id: number;
  emoji: string;
}

function shuffleCards(): CardData[] {
  const deck = EMOJIS.flatMap((emoji, i) => [
    { id: i * 2, emoji },
    { id: i * 2 + 1, emoji },
  ]);
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calcScore(moves: number): number {
  return Math.max(0, 100 - (moves - TOTAL_PAIRS) * 5);
}

export default function ColorMatchPage() {
  const { mode } = useThemeMode();
  const { selected } = useGrandkid();

  const [cards, setCards] = useState<CardData[]>(() => shuffleCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);

  // Check win condition
  useEffect(() => {
    if (matched.size === TOTAL_PAIRS && moves > 0) {
      setGameOver(true);
      playWin();
    }
  }, [matched, moves]);

  // Submit score on win
  useEffect(() => {
    if (!gameOver || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'color-match',
        score: calcScore(moves),
        completed: true,
      })
      .catch(() => {
        // Score submit failed — non-critical, game still works
      });
  }, [gameOver, scoreSubmitted, selected, moves]);

  const handleFlip = useCallback(
    (index: number) => {
      if (locked) return;
      if (flipped.includes(index)) return;
      if (matched.has(cards[index].emoji)) return;

      playFlip();
      const next = [...flipped, index];

      if (next.length === 2) {
        setMoves((m) => m + 1);
        setFlipped(next);

        const [a, b] = next;
        if (cards[a].emoji === cards[b].emoji) {
          // Match found
          playMatch();
          setMatched((prev) => new Set(prev).add(cards[a].emoji));
          setFlipped([]);
        } else {
          // Mismatch — flip back after delay
          playMismatch();
          setLocked(true);
          setTimeout(() => {
            setFlipped([]);
            setLocked(false);
          }, 800);
        }
      } else {
        setFlipped(next);
      }
    },
    [flipped, locked, matched, cards],
  );

  const playAgain = useCallback(() => {
    setCards(shuffleCards());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setGameOver(false);
    setScoreSubmitted(false);
    setLocked(false);
  }, []);

  const score = calcScore(moves);

  return (
    <PageContainer title="Color Match" subtitle="Find all the matching pairs!">
      <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
      {/* Move counter */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Moves: {moves}
        </Typography>
      </Box>

      {/* Card grid */}
      <Box className={styles.grid} sx={locked ? { pointerEvents: 'none' } : undefined}>
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.has(card.emoji);
          const isMatched = matched.has(card.emoji);

          return (
            <Box
              key={card.id}
              className={`${styles.card} ${isFlipped ? styles.flipped : ''} ${isMatched ? styles.matched : ''}`}
              onClick={() => handleFlip(index)}
            >
              <Box className={styles.cardInner}>
                <Box className={styles.cardFront}>?</Box>
                <Box
                  className={styles.cardBack}
                  sx={{
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)',
                  }}
                >
                  {card.emoji}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      </Box>

      {/* Win screen */}
      {gameOver && (
        <Box className={styles.winOverlay}>
          <Box className={styles.celebration}>🎉🏆🎉</Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            You did it!
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
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
