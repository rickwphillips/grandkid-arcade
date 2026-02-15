'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import {
  ROWS,
  COLS,
  createBoard,
  dropPiece,
  checkWin,
  isBoardFull,
  getAIMove,
  calcScore,
  type Board,
} from './gameLogic';
import { playDrop, playWin, playInvalid } from './sounds';
import styles from './page.module.scss';

type Mode = 'ai' | 'friend';
type Phase = 'select' | 'play' | 'done';

export default function Connect4Page() {
  const { mode: themeMode } = useThemeMode();
  const { selected } = useGrandkid();

  const [phase, setPhase] = useState<Phase>('select');
  const [gameMode, setGameMode] = useState<Mode>('ai');
  const [board, setBoard] = useState<Board>(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'yellow'>('red');
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState<'red' | 'yellow' | 'draw' | null>(null);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null);
  const [showWinBadge, setShowWinBadge] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup AI timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  // Show win badge when entering done phase
  useEffect(() => {
    if (phase === 'done') setShowWinBadge(true);
  }, [phase]);

  const startGame = useCallback((m: Mode) => {
    setGameMode(m);
    setBoard(createBoard());
    setCurrentPlayer('red');
    setMoves(0);
    setWinner(null);
    setWinCells([]);
    setScoreSubmitted(false);
    setAiThinking(false);
    setLastDrop(null);
    setPhase('play');
  }, []);

  const handleColumnClick = useCallback(
    (col: number) => {
      if (phase !== 'play' || winner) return;
      if (aiThinking) return;

      const result = dropPiece(board, col, currentPlayer);
      if (!result) {
        playInvalid();
        return;
      }

      playDrop();
      const { newBoard, row } = result;
      const newMoves = moves + 1;
      setLastDrop({ row, col });
      setBoard(newBoard);
      setMoves(newMoves);

      // Check win
      const winPositions = checkWin(newBoard, row, col);
      if (winPositions) {
        setWinner(currentPlayer);
        setWinCells(winPositions);
        setPhase('done');
        playWin();
        return;
      }

      // Check draw
      if (isBoardFull(newBoard)) {
        setWinner('draw');
        setPhase('done');
        return;
      }

      // Switch turns
      const nextPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
      setCurrentPlayer(nextPlayer);

      // AI move (if vs AI and it's now yellow's turn)
      if (gameMode === 'ai' && nextPlayer === 'yellow') {
        setAiThinking(true);
        aiTimerRef.current = setTimeout(() => {
          const aiCol = getAIMove(newBoard, 'yellow', 'red');
          const aiResult = dropPiece(newBoard, aiCol, 'yellow');
          if (!aiResult) {
            setAiThinking(false);
            return;
          }

          playDrop();
          setLastDrop({ row: aiResult.row, col: aiCol });
          setBoard(aiResult.newBoard);
          setMoves((m) => m + 1);

          const aiWin = checkWin(aiResult.newBoard, aiResult.row, aiCol);
          if (aiWin) {
            setWinner('yellow');
            setWinCells(aiWin);
            setPhase('done');
            playWin();
          } else if (isBoardFull(aiResult.newBoard)) {
            setWinner('draw');
            setPhase('done');
          } else {
            setCurrentPlayer('red');
          }
          setAiThinking(false);
        }, 500);
      }
    },
    [board, currentPlayer, phase, winner, aiThinking, gameMode, moves],
  );

  // Submit score when grandkid beats AI
  useEffect(() => {
    if (phase !== 'done' || scoreSubmitted || !selected) return;
    if (gameMode !== 'ai' || winner !== 'red') return;
    setScoreSubmitted(true);
    api
      .submitScore({
        grandkid_id: selected.id,
        game_slug: 'connect-4',
        score: calcScore(moves),
        completed: true,
      })
      .catch(() => {
        // Non-critical
      });
  }, [phase, scoreSubmitted, selected, gameMode, winner, moves]);

  const playAgain = useCallback(() => {
    setBoard(createBoard());
    setCurrentPlayer('red');
    setMoves(0);
    setWinner(null);
    setWinCells([]);
    setScoreSubmitted(false);
    setAiThinking(false);
    setLastDrop(null);
    setShowWinBadge(false);
    setPhase('play');
  }, []);

  const newGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setPhase('select');
    setBoard(createBoard());
    setCurrentPlayer('red');
    setMoves(0);
    setWinner(null);
    setWinCells([]);
    setScoreSubmitted(false);
    setAiThinking(false);
    setLastDrop(null);
    setShowWinBadge(false);
  }, []);

  const isWinCell = (row: number, col: number) =>
    winCells.some(([r, c]) => r === row && c === col);

  const score = calcScore(moves);

  // --- Mode selection ---
  if (phase === 'select') {
    return (
      <PageContainer title="Connect 4" subtitle="Drop pieces to connect four in a row!">
        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', fontWeight: 600, mb: 1 }}
          >
            Choose a mode
          </Typography>
          <Box className={styles.modeSelect}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SmartToyIcon />}
              onClick={() => startGame('ai')}
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              vs Computer
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PeopleIcon />}
              onClick={() => startGame('friend')}
              sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
            >
              vs Friend
            </Button>
          </Box>
        </Box>
      </PageContainer>
    );
  }

  // --- Gameplay + Done ---
  const turnLabel =
    gameMode === 'ai'
      ? currentPlayer === 'red'
        ? 'Your turn'
        : 'Computer thinking...'
      : currentPlayer === 'red'
        ? 'Red\u2019s turn'
        : 'Yellow\u2019s turn';

  const resultLabel =
    winner === 'draw'
      ? 'It\u2019s a draw!'
      : gameMode === 'ai'
        ? winner === 'red'
          ? 'You win!'
          : 'Computer wins!'
        : winner === 'red'
          ? 'Red wins!'
          : 'Yellow wins!';

  return (
    <PageContainer title="Connect 4" subtitle="Drop pieces to connect four in a row!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
        <Box className={`${styles.gameArea} ${themeMode === 'dark' ? styles.gameAreaDark : ''}`}>
          {/* Turn indicator + move counter */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {phase === 'play' && (
              <Box className={styles.turnIndicator}>
                <span
                  className={`${styles.turnDot} ${
                    currentPlayer === 'red' ? styles.turnDotRed : styles.turnDotYellow
                  }`}
                />
                <Typography variant="h6" color="text.secondary">
                  {turnLabel}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Moves: {moves}
            </Typography>
          </Box>

          {/* Board with win overlay */}
          <Box sx={{ position: 'relative' }}>
            <Box className={styles.board}>
              {Array.from({ length: COLS }, (_, col) => (
                <Box
                  key={col}
                  className={`${styles.column} ${phase !== 'play' || aiThinking ? styles.columnDisabled : ''}`}
                  onClick={() => handleColumnClick(col)}
                >
                  {Array.from({ length: ROWS }, (_, row) => {
                    const cell = board[row][col];
                    const winning = isWinCell(row, col);
                    const isNewDrop = lastDrop?.row === row && lastDrop?.col === col;
                    return (
                      <Box key={row} className={styles.cell}>
                        {cell && (
                          <Box
                            className={`${
                              isNewDrop ? styles.piece : styles.pieceStatic
                            } ${
                              cell === 'red' ? styles.pieceRed : styles.pieceYellow
                            } ${winning ? styles.winPiece : ''}`}
                            style={
                              isNewDrop
                                ? {
                                    '--drop-rows': row + 1,
                                    animationDuration: `${0.15 + row * 0.07}s`,
                                  } as React.CSSProperties
                                : undefined
                            }
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
              {/* Board face overlay — blue surface with circular holes */}
              <Box className={styles.boardFace} />
            </Box>

            <WinBadge
              visible={phase === 'done' && showWinBadge}
              onClose={() => setShowWinBadge(false)}
              title={resultLabel}
              celebration={winner === 'draw' ? '🤝' : '🎉🏆🎉'}
              moves={gameMode === 'ai' && winner === 'red' ? moves : undefined}
              score={gameMode === 'ai' && winner === 'red' ? score : undefined}
              message={
                selected && scoreSubmitted
                  ? `Score saved for ${selected.name}!`
                  : undefined
              }
            />
          </Box>

          {/* Win action buttons (below board, always accessible) */}
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
