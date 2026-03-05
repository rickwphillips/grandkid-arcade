'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { WinBadge } from '@/app/components/WinBadge';
import { PageContainer } from '@/app/components/PageContainer';
import { FloatingLoveMessages } from '@/app/components/FloatingLoveMessages';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';
import type { PuzzleImage } from '@/app/lib/types';
import styles from './page.module.scss';
import { DIFFICULTY_CONFIG, defaultDifficultyForAge, computeCoverCrop } from './puzzleLogic';
import type { Difficulty } from './puzzleLogic';

const CANVAS_SIZE = 520;
const PUZZLE_CONTAINER_ID = 'headbreaker-puzzle-container';

type Phase = 'select' | 'play' | 'win';

/**
 * Pre-scale the source image to CANVAS_SIZE so headbreaker pieces never reach
 * outside the image bounds during shuffle, which would cause Konva fillPattern
 * tiling. Uses cover-crop to avoid stretching or repeating.
 */
function prescaleImage(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const { srcX, srcY, srcW, srcH } = computeCoverCrop(img.naturalWidth, img.naturalHeight, width, height);
  canvas.getContext('2d')!.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);
  return canvas;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hbCanvasRef = useRef<any>(null);

  useEffect(() => {
    if (selected) setDifficulty(defaultDifficultyForAge(selected.age));
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    api
      .getPuzzleImages()
      .then((list) => {
        if (!cancelled) {
          setImages(list);
          if (list.length > 0)
            setSelectedImageId(list[Math.floor(Math.random() * list.length)].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingImages(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'play' || !imageDataUri) return;

    let cancelled = false;
    const img = new Image();
    img.src = imageDataUri;

    img.onload = async () => {
      if (cancelled) return;

      const mod = await import('headbreaker');
      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hb = (mod as any).default ?? mod;
      const { rows, cols, pieceSize, proximity } = DIFFICULTY_CONFIG[difficulty];
      const pieceRadius = Math.round(pieceSize / 2);

      // Pre-scale to exact puzzle dimensions (pieceSize * cols × pieceSize * rows).
      // With scale=1 and headAnchor at (pieceRadius, pieceRadius), each piece's
      // fillPatternOffset resolves to the correct image region automatically.
      const scaledImg = prescaleImage(img, CANVAS_SIZE, CANVAS_SIZE);

      // Place the puzzle grid starting at (pieceRadius, pieceRadius) so the
      // first piece's top-left edge aligns with the canvas origin.
      const manufacturer = new hb.Manufacturer();
      manufacturer.withDimensions(cols, rows);
      manufacturer.withHeadAt(hb.anchor(pieceRadius, pieceRadius));

      const canvas = new hb.Canvas(PUZZLE_CONTAINER_ID, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        pieceSize,
        proximity,
        borderFill: 2,
        strokeColor: mode === 'dark' ? '#aaa' : '#555',
        lineSoftness: 0.18,
        image: scaledImg,
        painter: new hb.painters.Konva(),
        fixed: true,
        preventOffstageDrag: true,
      });

      canvas.autogenerateWithManufacturer(manufacturer);
      canvas.shuffle(0.85);
      canvas.draw();

      // After each drop, nudge out-of-bounds groups back in bounds as a unit.
      // We use headbreaker's piece.translate() so its internal position model
      // stays in sync — direct Konva node.x() writes leave headbreaker's model
      // stale and break subsequent snap detection.
      const konvaLayer = canvas['__konvaLayer__'];
      const stage = konvaLayer?.getStage?.();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hbPieces: any[] = (canvas as any).puzzle?.pieces ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeToHbPiece = new Map<any, any>();
      hbPieces.forEach((piece: any) => {
        if (piece.shape) nodeToHbPiece.set(piece.shape, piece);
      });

      if (stage) {
        stage.on('dragend', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nodes: any[] = konvaLayer.find((n: any) => n.draggable?.());
          if (!nodes.length) return;

          // Cluster connected pieces by proximity (connected pieces sit exactly
          // pieceSize apart; use 1.1× as the threshold to avoid false merges).
          const snapDist = pieceSize * 1.02;
          const parent = nodes.map((_: unknown, i: number) => i);
          function find(i: number): number {
            if (parent[i] !== i) parent[i] = find(parent[i]);
            return parent[i];
          }
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const ddx = nodes[i].x() - nodes[j].x();
              const ddy = nodes[i].y() - nodes[j].y();
              if (Math.sqrt(ddx * ddx + ddy * ddy) < snapDist) {
                parent[find(i)] = find(j);
              }
            }
          }

          // Compute composite bounding box per cluster.
          const groupBoxes = new Map<number, { x1: number; y1: number; x2: number; y2: number }>();
          nodes.forEach((node: any, i: number) => {
            const root = find(i);
            const box  = node.getClientRect();
            const prev = groupBoxes.get(root);
            if (!prev) {
              groupBoxes.set(root, { x1: box.x, y1: box.y, x2: box.x + box.width, y2: box.y + box.height });
            } else {
              prev.x1 = Math.min(prev.x1, box.x);
              prev.y1 = Math.min(prev.y1, box.y);
              prev.x2 = Math.max(prev.x2, box.x + box.width);
              prev.y2 = Math.max(prev.y2, box.y + box.height);
            }
          });

          // One correction delta per cluster, applied uniformly to all members.
          const groupDeltas = new Map<number, { dx: number; dy: number }>();
          groupBoxes.forEach((box, root) => {
            let dx = 0, dy = 0;
            if (box.x1 < 0) dx = -box.x1;
            else if (box.x2 > CANVAS_SIZE) dx = CANVAS_SIZE - box.x2;
            if (box.y1 < 0) dy = -box.y1;
            else if (box.y2 > CANVAS_SIZE) dy = CANVAS_SIZE - box.y2;
            if (dx !== 0 || dy !== 0) groupDeltas.set(root, { dx, dy });
          });

          let needsDraw = false;
          nodes.forEach((node: any, i: number) => {
            const delta = groupDeltas.get(find(i));
            if (!delta) return;
            const hbPiece = nodeToHbPiece.get(node);
            if (hbPiece?.translate) {
              hbPiece.translate(delta.dx, delta.dy);
            } else {
              node.x(node.x() + delta.dx);
              node.y(node.y() + delta.dy);
            }
            needsDraw = true;
          });
          if (needsDraw) konvaLayer.batchDraw();
        });
      }

      canvas.attachSolvedValidator();
      canvas.onValid((valid: boolean) => {
        if (valid) {
          setTimeout(() => {
            setPhase('win');
            setShowWinBadge(true);
          }, 500);
        }
      });

      hbCanvasRef.current = canvas;
    };

    return () => {
      cancelled = true;
      if (hbCanvasRef.current) {
        try {
          hbCanvasRef.current['__konvaLayer__']?.getStage()?.destroy();
        } catch {
          // ignore
        }
        hbCanvasRef.current = null;
      }
    };
  }, [phase, imageDataUri, difficulty, mode]);

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

  const handleStart = useCallback(async () => {
    if (!selectedImageId) return;
    setStarting(true);
    try {
      const imgData = await api.getPuzzleImage(selectedImageId);
      setImageDataUri(imgData.image_data);
      setScoreSubmitted(false);
      setShowWinBadge(false);
      setPhase('play');
    } catch {
      // Non-critical
    } finally {
      setStarting(false);
    }
  }, [selectedImageId]);

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

              <Typography
                variant="subtitle1"
                sx={{ textAlign: 'center', mt: 3, mb: 1, fontWeight: 600 }}
              >
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
                  startIcon={
                    starting ? <CircularProgress size={20} color="inherit" /> : undefined
                  }
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
    <PageContainer title="Jigsaw Puzzle" subtitle="Drag pieces together to connect them!">
      <Box sx={{ position: 'relative' }}>
        {selected && (
          <FloatingLoveMessages name={selected.name} active={phase === 'play'} />
        )}
        <Box className={`${styles.gameArea} ${mode === 'dark' ? styles.gameAreaDark : ''}`}>
          <Box
            sx={{
              position: 'relative',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              maxWidth: '100%',
              mx: 'auto',
            }}
          >
            {phase === 'win' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUri}
                alt="Completed puzzle"
                className={styles.puzzleContainer}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Box id={PUZZLE_CONTAINER_ID} className={styles.puzzleContainer} />
            )}
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
