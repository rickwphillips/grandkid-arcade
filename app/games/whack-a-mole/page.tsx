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
import { playWhack, playGoldenWhack, playEnd } from './sounds';
import { ASSET_BASE } from '@/app/lib/api';
import styles from './page.module.scss';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'playing' | 'done';
type MoleType = 'normal' | 'golden';

const HOLES = 9;
const ROUND_SECONDS = 30;
const GOLDEN_CHANCE = 0.15; // ~1-in-7 chance a spawned mole is golden

const SETTINGS: Record<Difficulty, { spawnMs: number; lifeMs: number; maxMoles: number; pts: number }> = {
  easy:   { spawnMs: 1200, lifeMs: 1600, maxMoles: 1, pts: 5  },
  medium: { spawnMs: 800,  lifeMs: 1100, maxMoles: 2, pts: 10 },
  hard:   { spawnMs: 500,  lifeMs: 750,  maxMoles: 3, pts: 15 },
};

export default function WhackAMolePage() {
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [activeMoles, setActiveMoles] = useState<Map<number, MoleType>>(new Map());
  const [justHit, setJustHit] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const removalTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastSpawnWasGolden = useRef(false);
  const malletWrapperRef = useRef<HTMLDivElement>(null);
  const malletImgRef = useRef<HTMLImageElement>(null);

  const handleGridPointerMove = useCallback((e: React.PointerEvent) => {
    if (malletWrapperRef.current) {
      malletWrapperRef.current.style.left = `${e.clientX}px`;
      malletWrapperRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  const handleGridPointerEnter = useCallback(() => {
    if (malletWrapperRef.current) malletWrapperRef.current.style.display = 'block';
  }, []);

  const handleGridPointerLeave = useCallback(() => {
    if (malletWrapperRef.current) malletWrapperRef.current.style.display = 'none';
  }, []);

  const triggerMalletStrike = useCallback(() => {
    const el = malletImgRef.current;
    if (!el) return;
    el.classList.remove(styles.malletCursorStriking);
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add(styles.malletCursorStriking);
  }, []);

  const clearRemovalTimers = useCallback(() => {
    removalTimers.current.forEach(clearTimeout);
    removalTimers.current = [];
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    clearRemovalTimers();
    lastSpawnWasGolden.current = false;
    setDifficulty(diff);
    setActiveMoles(new Map());
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
        const type: MoleType =
          !lastSpawnWasGolden.current && Math.random() < GOLDEN_CHANCE ? 'golden' : 'normal';
        lastSpawnWasGolden.current = type === 'golden';

        // Schedule auto-removal
        const t = setTimeout(() => {
          setActiveMoles((m) => {
            const next = new Map(m);
            next.delete(hole);
            return next;
          });
        }, lifeMs);
        removalTimers.current.push(t);

        return new Map([...prev, [hole, type]]);
      });
    }, spawnMs);

    return () => clearInterval(interval);
  }, [phase, difficulty]);

  // Clean up on game end
  useEffect(() => {
    if (phase === 'done') {
      clearRemovalTimers();
      setActiveMoles(new Map());
    }
  }, [phase, clearRemovalTimers]);

  const handleWhack = useCallback(
    (hole: number) => {
      if (phase !== 'playing' || !activeMoles.has(hole)) return;

      const isGolden = activeMoles.get(hole) === 'golden';
      if (isGolden) playGoldenWhack(); else playWhack();

      // Remove mole immediately
      setActiveMoles((prev) => {
        const next = new Map(prev);
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

      const pts = SETTINGS[difficulty].pts * (isGolden ? 10 : 1);
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
    setActiveMoles(new Map());
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

  return (
    <PageContainer title="Whack-a-Mole" subtitle="Tap the moles before they hide!">
      {/* Animated mallet cursor — only visible during play on pointer devices */}
      <div
        ref={malletWrapperRef}
        style={{ position: 'fixed', pointerEvents: 'none', zIndex: 9999, display: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={malletImgRef} src={`${ASSET_BASE}/cursors/mallet.png`} alt="" className={styles.malletCursor} />
      </div>

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
              maxWidth: 400,
              mx: 'auto',
              cursor: phase === 'playing' ? 'none' : 'default',
            }}
            onPointerMove={phase === 'playing' ? handleGridPointerMove : undefined}
            onPointerEnter={phase === 'playing' ? handleGridPointerEnter : undefined}
            onPointerLeave={handleGridPointerLeave}
            onPointerDown={phase === 'playing' ? triggerMalletStrike : undefined}
          >
            {Array.from({ length: HOLES }, (_, hole) => {
              const isActive = activeMoles.has(hole);
              const isGolden = activeMoles.get(hole) === 'golden';
              const wasHit = justHit.has(hole);
              return (
                <Box
                  key={hole}
                  onPointerDown={() => handleWhack(hole)}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    bgcolor: wasHit ? '#8B4513' : '#5D3A1A',
                    boxShadow: isGolden && isActive
                      ? 'inset 0 8px 16px rgba(0,0,0,0.5), 0 0 12px 4px rgba(255,215,0,0.6)'
                      : 'inset 0 8px 16px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    transition: 'background-color 0.15s, box-shadow 0.3s',
                    userSelect: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  {/* Mole pops up from the hole */}
                  <Box
                    component="img"
                    src={isGolden ? `${ASSET_BASE}/mole-golden.png` : `${ASSET_BASE}/mole.png`}
                    alt={isGolden ? 'golden mole' : 'mole'}
                    className={isGolden && isActive && !wasHit ? styles.goldenMole : undefined}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      width: '90%',
                      height: 'auto',
                      transform: isActive
                        ? 'translate(-50%, 0%)'
                        : 'translate(-50%, 110%)',
                      transition: 'transform 0.12s ease-out',
                      filter: wasHit ? 'brightness(1.8)' : undefined,
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
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
            celebration={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box component="img" src={`${ASSET_BASE}/mole.png`} alt="mole" sx={{ width: 48, height: 'auto' }} />
                <Box component="img" src={`${ASSET_BASE}/cursors/mallet.png`} alt="mallet" sx={{ width: 120, height: 'auto' }} />
                <Box component="img" src={`${ASSET_BASE}/mole.png`} alt="mole" sx={{ width: 48, height: 'auto' }} />
              </Box>
            }
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
