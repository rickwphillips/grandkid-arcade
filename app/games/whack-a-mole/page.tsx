'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import { playWhack, playEnd } from './sounds';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'playing' | 'done';

const HOLES = 9;
const ROUND_SECONDS = 30;

const SETTINGS: Record<Difficulty, { spawnMs: number; lifeMs: number; maxMoles: number; pts: number }> = {
  easy:   { spawnMs: 1200, lifeMs: 1600, maxMoles: 1, pts: 5  },
  medium: { spawnMs: 800,  lifeMs: 1100, maxMoles: 2, pts: 10 },
  hard:   { spawnMs: 500,  lifeMs: 750,  maxMoles: 3, pts: 15 },
};

export default function WhackAMolePage() {
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [activeMoles, setActiveMoles] = useState<Set<number>>(new Set());
  const [justHit, setJustHit] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const removalTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearRemovalTimers = useCallback(() => {
    removalTimers.current.forEach(clearTimeout);
    removalTimers.current = [];
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    clearRemovalTimers();
    setDifficulty(diff);
    setActiveMoles(new Set());
    setJustHit(new Set());
    setScore(0);
    setHits(0);
    setTimeLeft(ROUND_SECONDS);
    setShowWinBadge(false);
    setScoreSubmitted(false);
    setPhase('playing');
  }, [clearRemovalTimers]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('done');
          setShowWinBadge(true);
          playEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Mole spawner
  useEffect(() => {
    if (phase !== 'playing') return;
    const { spawnMs, lifeMs, maxMoles } = SETTINGS[difficulty];

    const interval = setInterval(() => {
      setActiveMoles((prev) => {
        if (prev.size >= maxMoles) return prev;
        const available = Array.from({ length: HOLES }, (_, i) => i).filter(
          (i) => !prev.has(i),
        );
        if (available.length === 0) return prev;
        const hole = available[Math.floor(Math.random() * available.length)];

        // Schedule auto-removal
        const t = setTimeout(() => {
          setActiveMoles((m) => {
            const next = new Set(m);
            next.delete(hole);
            return next;
          });
        }, lifeMs);
        removalTimers.current.push(t);

        return new Set([...prev, hole]);
      });
    }, spawnMs);

    return () => clearInterval(interval);
  }, [phase, difficulty]);

  // Clean up on game end
  useEffect(() => {
    if (phase === 'done') {
      clearRemovalTimers();
      setActiveMoles(new Set());
    }
  }, [phase, clearRemovalTimers]);

  const handleWhack = useCallback(
    (hole: number) => {
      if (phase !== 'playing' || !activeMoles.has(hole)) return;

      playWhack();

      // Remove mole immediately
      setActiveMoles((prev) => {
        const next = new Set(prev);
        next.delete(hole);
        return next;
      });

      // Show hit flash
      setJustHit((prev) => new Set([...prev, hole]));
      setTimeout(() => {
        setJustHit((prev) => {
          const next = new Set(prev);
          next.delete(hole);
          return next;
        });
      }, 300);

      const pts = SETTINGS[difficulty].pts;
      setScore((s) => s + pts);
      setHits((h) => h + 1);
    },
    [phase, activeMoles, difficulty],
  );

  // Submit score on done
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'whack-a-mole',
        score,
        completed: true,
      })
      .catch(() => {});
  }, [phase, scoreSubmitted, selected, score]);

  const playAgain = useCallback(() => startGame(difficulty), [difficulty, startGame]);

  const newDifficulty = useCallback(() => {
    clearRemovalTimers();
    setPhase('select');
    setActiveMoles(new Set());
  }, [clearRemovalTimers]);

  // --- Select phase ---
  if (phase === 'select') {
    return (
      <PageContainer title="Whack-a-Mole" subtitle="Tap the moles before they hide!">
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
              Easy — 1 mole · slow
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('medium')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Medium — 2 moles · faster
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('hard')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Hard — 3 moles · fast
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            {ROUND_SECONDS} seconds · tap every mole you see!
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  // --- Play / Done phase ---
  const progress = (timeLeft / ROUND_SECONDS) * 100;

  // SVG mallet cursor — striking face at hotspot (2, 2)
  const malletCursor =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E` +
    `%3Crect x='1' y='1' width='18' height='11' rx='2' fill='%235D3A1A' stroke='%23C4A35A' stroke-width='1.5'/%3E` +
    `%3Cline x1='16' y1='10' x2='30' y2='30' stroke='%23C4A35A' stroke-width='5' stroke-linecap='round'/%3E` +
    `%3C/svg%3E") 2 2, pointer`;

  return (
    <PageContainer title="Whack-a-Mole" subtitle="Tap the moles before they hide!">
      <Box sx={{ position: 'relative' }}>
        {selected && <FloatingLoveMessages name={selected.name} active={phase === 'playing'} />}

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
          {/* Timer + score row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {timeLeft}s left
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score: {score}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={timeLeft <= 5 ? 'error' : 'primary'}
            sx={{ borderRadius: 4, height: 8, mb: 3 }}
          />

          {/* 3×3 mole grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              maxWidth: 340,
              mx: 'auto',
              cursor: phase === 'playing' ? malletCursor : 'default',
            }}
          >
            {Array.from({ length: HOLES }, (_, hole) => {
              const isActive = activeMoles.has(hole);
              const wasHit = justHit.has(hole);
              return (
                <Box
                  key={hole}
                  onClick={() => handleWhack(hole)}
                  sx={{
                    position: 'relative',
                    height: 90,
                    borderRadius: '50%',
                    bgcolor: wasHit ? '#8B4513' : '#5D3A1A',
                    boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    transition: 'background-color 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {/* Mole pops up from the hole */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: isActive
                        ? 'translate(-50%, 0%)'
                        : 'translate(-50%, 110%)',
                      transition: 'transform 0.12s ease-out',
                      fontSize: '3rem',
                      lineHeight: 1,
                      filter: wasHit ? 'brightness(2)' : 'none',
                    }}
                  >
                    🐹
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Hits counter */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mt: 2 }}
          >
            {hits} mole{hits !== 1 ? 's' : ''} whacked
          </Typography>

          {/* Win Badge */}
          <WinBadge
            visible={phase === 'done' && showWinBadge}
            onClose={() => setShowWinBadge(false)}
            title="Time's up!"
            celebration="🐹🔨🐹"
            score={score}
            message={
              selected && scoreSubmitted
                ? `${hits} moles whacked! Score saved for ${selected.name}!`
                : `${hits} moles whacked!`
            }
          />

          {/* Action buttons */}
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
