'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'select' | 'play' | 'done';
type AnswerState = 'idle' | 'correct' | 'wrong';

interface Card {
  question: string;
  answer: number;
  choices: number[];
}

const CARDS_PER_GAME = 10;
const POINTS_PER_CORRECT = 10;

function generateCard(difficulty: Difficulty): Card {
  let a: number, b: number, question: string, answer: number;

  if (difficulty === 'easy') {
    a = Math.floor(Math.random() * 11);
    b = Math.floor(Math.random() * 11);
    question = `${a} + ${b}`;
    answer = a + b;
  } else if (difficulty === 'medium') {
    const useSubtraction = Math.random() < 0.5;
    if (useSubtraction) {
      a = Math.floor(Math.random() * 21);
      b = Math.floor(Math.random() * (a + 1));
      question = `${a} \u2212 ${b}`;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 21);
      b = Math.floor(Math.random() * 21);
      question = `${a} + ${b}`;
      answer = a + b;
    }
  } else {
    const opIndex = Math.floor(Math.random() * 4);
    if (opIndex === 0) {
      a = Math.floor(Math.random() * 21);
      b = Math.floor(Math.random() * 21);
      question = `${a} + ${b}`;
      answer = a + b;
    } else if (opIndex === 1) {
      a = Math.floor(Math.random() * 21);
      b = Math.floor(Math.random() * (a + 1));
      question = `${a} \u2212 ${b}`;
      answer = a - b;
    } else if (opIndex === 2) {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      question = `${a} \u00d7 ${b}`;
      answer = a * b;
    } else {
      b = Math.floor(Math.random() * 11) + 2;
      const quotient = Math.floor(Math.random() * 12) + 1;
      a = b * quotient;
      question = `${a} \u00f7 ${b}`;
      answer = quotient;
    }
  }

  const choices = new Set<number>([answer]);
  let attempts = 0;
  while (choices.size < 4 && attempts < 100) {
    attempts++;
    const offset = Math.floor(Math.random() * 9) - 4;
    const distractor = answer + offset;
    if (distractor >= 0 && !choices.has(distractor)) {
      choices.add(distractor);
    }
  }
  // Fallback: pad with sequential numbers
  let n = answer + 5;
  while (choices.size < 4) {
    if (!choices.has(n)) choices.add(n);
    n++;
  }

  return { question, answer, choices: Array.from(choices).sort(() => Math.random() - 0.5) };
}

export default function MathFlashCardsPage() {
  const { mode: themeMode } = useThemeMode();
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCards(Array.from({ length: CARDS_PER_GAME }, () => generateCard(diff)));
    setCardIndex(0);
    setScore(0);
    setCorrect(0);
    setAnswerState('idle');
    setSelectedChoice(null);
    setShowWinBadge(false);
    setScoreSubmitted(false);
    setPhase('play');
  }, []);

  const handleChoice = useCallback(
    (choice: number) => {
      if (answerState !== 'idle') return;
      const card = cards[cardIndex];
      const isCorrect = choice === card.answer;
      setSelectedChoice(choice);
      setAnswerState(isCorrect ? 'correct' : 'wrong');
      if (isCorrect) {
        setScore((s) => s + POINTS_PER_CORRECT);
        setCorrect((c) => c + 1);
      }
      setTimeout(() => {
        const next = cardIndex + 1;
        if (next >= CARDS_PER_GAME) {
          setPhase('done');
          setShowWinBadge(true);
        } else {
          setCardIndex(next);
          setAnswerState('idle');
          setSelectedChoice(null);
        }
      }, 1000);
    },
    [answerState, cards, cardIndex],
  );

  // Submit score on completion
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected) return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'math-flash-cards',
        score,
        completed: true,
      })
      .catch(() => {});
  }, [phase, scoreSubmitted, selected, score]);

  const playAgain = useCallback(() => startGame(difficulty), [difficulty, startGame]);

  const newDifficulty = useCallback(() => {
    setPhase('select');
    setCards([]);
    setCardIndex(0);
  }, []);

  // --- Select phase ---
  if (phase === 'select') {
    return (
      <PageContainer title="Math Flash Cards" subtitle="How fast can you solve them?">
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
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 320, mx: 'auto' }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => startGame('easy')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Easy — Addition up to 10
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('medium')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Medium — Add &amp; Subtract up to 20
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => startGame('hard')}
              sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              Hard — All Four Operations
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            {CARDS_PER_GAME} cards &bull; 4 choices each &bull; {POINTS_PER_CORRECT} pts per correct
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  // --- Play / Done phase ---
  const currentCard = cards[cardIndex];
  const progress = phase === 'done' ? 100 : ((cardIndex + 1) / CARDS_PER_GAME) * 100;

  return (
    <PageContainer title="Math Flash Cards" subtitle="How fast can you solve them?">
      <Box sx={{ position: 'relative' }}>
        {selected && <FloatingLoveMessages name={selected.name} active={phase === 'play'} />}

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
          {/* Progress bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Card {Math.min(cardIndex + 1, CARDS_PER_GAME)} of {CARDS_PER_GAME}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Score: {score}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ borderRadius: 4, height: 8 }}
            />
          </Box>

          {/* Flash card question */}
          <Box
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              textAlign: 'center',
              border: '3px solid',
              borderColor:
                answerState === 'correct'
                  ? 'success.main'
                  : answerState === 'wrong'
                    ? 'error.main'
                    : 'divider',
              transition: 'border-color 0.2s',
              background: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 1, lineHeight: 1.2 }}>
              {currentCard?.question}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 400, color: 'text.secondary', mt: 1 }}>
              = ?
            </Typography>
          </Box>

          {/* Answer choices grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {currentCard?.choices.map((choice) => {
                const isCorrectAnswer = choice === currentCard.answer;
                const isSelectedWrong = selectedChoice === choice && !isCorrectAnswer;
                const highlightGreen = answerState !== 'idle' && isCorrectAnswer;
                const highlightRed = answerState !== 'idle' && isSelectedWrong;

                return (
                  <Box
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    sx={(theme) => ({
                      p: 2.5,
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: answerState === 'idle' ? 'pointer' : 'default',
                      border: '2px solid',
                      borderColor: highlightGreen
                        ? theme.palette.success.main
                        : highlightRed
                          ? theme.palette.error.main
                          : theme.palette.divider,
                      bgcolor: highlightGreen
                        ? 'success.main'
                        : highlightRed
                          ? 'error.main'
                          : theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.03)',
                      color:
                        highlightGreen || highlightRed
                          ? '#fff'
                          : theme.palette.text.primary,
                      transition: 'all 0.2s',
                      '&:hover':
                        answerState === 'idle'
                          ? {
                              borderColor: theme.palette.primary.main,
                              bgcolor:
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.12)'
                                  : 'rgba(0,0,0,0.06)',
                            }
                          : {},
                    })}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {choice}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

          {/* Win Badge overlay — covers full game panel (parent has position: relative) */}
          <WinBadge
            visible={phase === 'done' && showWinBadge}
            onClose={() => setShowWinBadge(false)}
            title="Nice work!"
            celebration="🎉🧮🎉"
            score={score}
            message={
              selected && scoreSubmitted
                ? `${correct}/${CARDS_PER_GAME} correct! Score saved for ${selected.name}!`
                : `${correct}/${CARDS_PER_GAME} correct!`
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

          {/* View Results toggle (after closing badge) */}
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
