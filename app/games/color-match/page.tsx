'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Chip, CircularProgress } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import { playFlip, playMatch, playMismatch, playWin } from './sounds';
import styles from './page.module.scss';

const FALLBACK_EMOJIS = ['🐶', '🐱', '🐸', '🦋', '🌈', '🍎', '🌻', '⭐', '🎸', '🚀', '🎨', '🌺'];

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'play' | 'done';

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string }> = {
  easy:   { pairs: 6,  cols: 3, label: 'Easy (6 pairs)' },
  medium: { pairs: 8,  cols: 4, label: 'Medium (8 pairs)' },
  hard:   { pairs: 12, cols: 4, label: 'Hard (12 pairs)' },
};

interface CardData {
  id: number;
  matchKey: string;
  type: 'image' | 'emoji';
  content: string;
}

function buildDeck(imageDataUris: string[], pairs: number): CardData[] {
  const cards: CardData[] = [];
  let pairIndex = 0;

  // Use uploaded images first
  for (const dataUri of imageDataUris.slice(0, pairs)) {
    const key = `img-${pairIndex}`;
    cards.push({ id: pairIndex * 2, matchKey: key, type: 'image', content: dataUri });
    cards.push({ id: pairIndex * 2 + 1, matchKey: key, type: 'image', content: dataUri });
    pairIndex++;
  }

  // Fill remaining with emojis
  let emojiIndex = 0;
  while (pairIndex < pairs) {
    const emoji = FALLBACK_EMOJIS[emojiIndex % FALLBACK_EMOJIS.length];
    const key = `emoji-${emoji}`;
    cards.push({ id: pairIndex * 2, matchKey: key, type: 'emoji', content: emoji });
    cards.push({ id: pairIndex * 2 + 1, matchKey: key, type: 'emoji', content: emoji });
    pairIndex++;
    emojiIndex++;
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function calcScore(moves: number, pairs: number): number {
  return Math.max(0, 100 - (moves - pairs) * 5);
}

export default function PictureMatcherPage() {
  const { mode } = useThemeMode();
  const { selected } = useGrandkid();

  const [loading, setLoading] = useState(true);
  const imageCache = useRef<string[]>([]);
  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<CardData[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showWinBadge, setShowWinBadge] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];

  // Fetch puzzle images on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.getPuzzleImages();
        const toFetch = list.slice(0, 12); // max needed for hard mode
        const results = await Promise.all(
          toFetch.map((img) => api.getPuzzleImage(img.id).catch(() => null)),
        );
        if (cancelled) return;
        imageCache.current = results
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => r.image_data);
      } catch {
        // Images unavailable — fall back to all emojis
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const cfg = DIFFICULTY_CONFIG[diff];
    setCards(buildDeck(imageCache.current, cfg.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setScoreSubmitted(false);
    setLocked(false);
    setPhase('play');
  }, []);

  // Check win condition
  useEffect(() => {
    if (phase !== 'play') return;
    if (matched.size === config.pairs && moves > 0) {
      setPhase('done');
      setShowWinBadge(true);
      playWin();
    }
  }, [matched, moves, config.pairs, phase]);

  // Submit score on win
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'color-match',
        score: calcScore(moves, config.pairs),
        completed: true,
      })
      .catch(() => {
        // Non-critical
      });
  }, [phase, scoreSubmitted, selected, moves, config.pairs]);

  const handleFlip = useCallback(
    (index: number) => {
      if (locked || phase !== 'play') return;
      if (flipped.includes(index)) return;
      if (matched.has(cards[index].matchKey)) return;

      playFlip();
      const next = [...flipped, index];

      if (next.length === 2) {
        setMoves((m) => m + 1);
        setFlipped(next);

        const [a, b] = next;
        if (cards[a].matchKey === cards[b].matchKey) {
          playMatch();
          setMatched((prev) => new Set(prev).add(cards[a].matchKey));
          setFlipped([]);
        } else {
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
    [flipped, locked, matched, cards, phase],
  );

  const playAgain = useCallback(() => {
    setCards(buildDeck(imageCache.current, config.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setScoreSubmitted(false);
    setLocked(false);
    setShowWinBadge(false);
    setPhase('play');
  }, [config.pairs]);

  const newGame = useCallback(() => {
    setPhase('select');
    setCards([]);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setScoreSubmitted(false);
    setLocked(false);
    setShowWinBadge(false);
  }, []);

  const score = calcScore(moves, config.pairs);

  // --- Difficulty selection ---
  if (phase === 'select') {
    return (
      <PageContainer title="Picture Matcher" subtitle="Find all the matching pairs!">
        <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 600, mb: 1 }}>
                Choose difficulty
              </Typography>
              <Box className={styles.difficultyRow}>
                {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof config][]).map(
                  ([key, cfg]) => (
                    <Chip
                      key={key}
                      label={cfg.label}
                      variant="outlined"
                      onClick={() => startGame(key)}
                      sx={{ fontWeight: 600, px: 2, py: 2.5, fontSize: '1rem', cursor: 'pointer' }}
                    />
                  ),
                )}
              </Box>
            </>
          )}
        </Box>
      </PageContainer>
    );
  }

  // --- Gameplay + Done ---
  const gridClass =
    config.cols === 3 ? styles.grid3 : styles.grid4;

  return (
    <PageContainer title="Picture Matcher" subtitle="Find all the matching pairs!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
        <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
          {/* Move counter */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Moves: {moves}
            </Typography>
          </Box>

          {/* Card grid with win overlay */}
          <Box sx={{ position: 'relative' }}>
            <Box className={gridClass} sx={locked ? { pointerEvents: 'none' } : undefined}>
              {cards.map((card, index) => {
                const isFlipped = flipped.includes(index) || matched.has(card.matchKey);
                const isMatched = matched.has(card.matchKey);

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
                        {card.type === 'image' ? (
                          <Box
                            component="img"
                            src={card.content}
                            alt=""
                            className={styles.cardImage}
                          />
                        ) : (
                          card.content
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <WinBadge
              visible={phase === 'done' && showWinBadge}
              onClose={() => setShowWinBadge(false)}
              title="You did it!"
              moves={moves}
              score={score}
              message={
                selected && scoreSubmitted
                  ? `Score saved for ${selected.name}!`
                  : undefined
              }
            />
          </Box>

          {/* Win action buttons (below grid, always accessible) */}
          {phase === 'done' && (
            <Box className={styles.actions}>
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
                Play Again
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={newGame}>
                New Game
              </Button>
            </Box>
          )}

          {/* View Results toggle when badge is dismissed */}
          {phase === 'done' && !showWinBadge && (
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
