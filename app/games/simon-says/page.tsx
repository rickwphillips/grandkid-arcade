'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import { playColor, playLose } from './sounds';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'showing' | 'input' | 'done';

const COLORS = [
  { label: 'Red',    active: '#ef5350', inactive: '#5a1a1a' },
  { label: 'Green',  active: '#66bb6a', inactive: '#1a3d1a' },
  { label: 'Blue',   active: '#42a5f5', inactive: '#1a2f4a' },
  { label: 'Yellow', active: '#ffee58', inactive: '#4a420a' },
];

const SPEEDS: Record<Difficulty, { flash: number; gap: number }> = {
  easy:   { flash: 800, gap: 400 },
  medium: { flash: 500, gap: 300 },
  hard:   { flash: 300, gap: 200 },
};

const POINTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

export default function SimonSaysPage() {
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const startGame = useCallback((diff: Difficulty) => {
    const first = Math.floor(Math.random() * 4);
    setDifficulty(diff);
    setSequence([first]);
    setPlayerInput([]);
    setRound(1);
    setScore(0);
    setActiveButton(null);
    setShowWinBadge(false);
    setScoreSubmitted(false);
    setPhase('showing');
  }, []);

  // Animate the sequence whenever phase becomes 'showing'
  useEffect(() => {
    if (phase !== 'showing') return;
    const { flash, gap } = SPEEDS[difficulty];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    sequence.forEach((colorIdx, i) => {
      timeouts.push(
        setTimeout(() => { setActiveButton(colorIdx); playColor(colorIdx); }, i * (flash + gap)),
      );
      timeouts.push(
        setTimeout(() => setActiveButton(null), i * (flash + gap) + flash),
      );
    });

    timeouts.push(
      setTimeout(() => {
        setPlayerInput([]);
        setPhase('input');
      }, sequence.length * (flash + gap)),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [phase, sequence, difficulty]);

  const handleButtonPress = useCallback(
    (colorIdx: number) => {
      if (phase !== 'input') return;

      // Flash the pressed button briefly
      setActiveButton(colorIdx);
      playColor(colorIdx);
      setTimeout(() => setActiveButton(null), 150);

      const expected = sequence[playerInput.length];
      if (colorIdx !== expected) {
        // Wrong — game over
        playLose();
        setTimeout(() => {
          setPhase('done');
          setShowWinBadge(true);
        }, 200);
        return;
      }

      const newInput = [...playerInput, colorIdx];
      setPlayerInput(newInput);

      if (newInput.length === sequence.length) {
        // Round complete — add next color and advance
        const pts = POINTS[difficulty];
        setScore((s) => s + pts);
        const next = Math.floor(Math.random() * 4);
        setTimeout(() => {
          setSequence((prev) => [...prev, next]);
          setRound((r) => r + 1);
          setPhase('showing');
        }, 600);
      }
    },
    [phase, sequence, playerInput, difficulty],
  );

  // Submit score on game over
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'simon-says',
        score,
        completed: true,
      })
      .catch(() => {});
  }, [phase, scoreSubmitted, selected, score]);

  const playAgain = useCallback(() => startGame(difficulty), [difficulty, startGame]);

  const newDifficulty = useCallback(() => {
    setPhase('select');
    setSequence([]);
    setPlayerInput([]);
    setRound(0);
  }, []);

  // --- Select phase ---
  if (phase === 'select') {
    return (
      <PageContainer title="Simon Says" subtitle="Watch the pattern, repeat it back!">
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 600, mb: 3 }}>
            Choose difficulty
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 320, mx: 'auto' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => startGame('easy')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Easy — Slow flashes · 5 pts/round
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('medium')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Medium — Faster · 10 pts/round
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('hard')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Hard — Fast · 15 pts/round
            </Button>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  // --- Play / Done phase ---
  const statusLabel =
    phase === 'showing'
      ? 'Watch…'
      : phase === 'input'
        ? `Your turn! (${playerInput.length}/${sequence.length})`
        : 'Game Over!';

  return (
    <PageContainer title="Simon Says" subtitle="Watch the pattern, repeat it back!">
      <Box sx={{ position: 'relative' }}>
        {selected && <FloatingLoveMessages name={selected.name} active={phase === 'input'} />}

        <Box
          sx={{
            position: 'relative',
            maxWidth: 420,
            mx: 'auto',
            p: 3,
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Status row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Chip label={`Round ${round}`} size="small" />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {statusLabel}
            </Typography>
            <Chip label={`${score} pts`} size="small" color="primary" />
          </Box>

          {/* Simon board — 2×2 grid of color buttons */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mb: 3,
              maxWidth: 320,
              mx: 'auto',
            }}
          >
            {COLORS.map((color, idx) => {
              const isActive = activeButton === idx;
              return (
                <Box
                  key={color.label}
                  onClick={() => handleButtonPress(idx)}
                  sx={{
                    height: 130,
                    borderRadius: 3,
                    cursor: phase === 'input' ? 'pointer' : 'default',
                    backgroundColor: isActive ? color.active : color.inactive,
                    boxShadow: isActive
                      ? `0 0 32px 8px ${color.active}88`
                      : 'none',
                    transition: 'background-color 0.08s ease, box-shadow 0.08s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none',
                    '&:hover':
                      phase === 'input'
                        ? { backgroundColor: color.active, opacity: 0.85 }
                        : {},
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isActive ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.3)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {color.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Win Badge */}
          <WinBadge
            visible={phase === 'done' && showWinBadge}
            onClose={() => setShowWinBadge(false)}
            title="Game Over!"
            celebration="🧠🎮🧠"
            score={score}
            message={
              selected && scoreSubmitted
                ? `${round - 1} round${round - 1 !== 1 ? 's' : ''} completed! Score saved for ${selected.name}!`
                : `${round - 1} round${round - 1 !== 1 ? 's' : ''} completed!`
            }
          />

          {/* Action buttons (done) */}
          {phase === 'done' && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={playAgain}>
                Play Again
              </Button>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={newDifficulty}>
                New Difficulty
              </Button>
            </Box>
          )}

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
