'use client';

import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import styles from './WinBadge.module.scss';

interface WinBadgeProps {
  /** Controls visibility */
  visible: boolean;
  /** Called when the user dismisses the badge */
  onClose: () => void;
  /** Heading text, e.g. "Puzzle Complete!" */
  title: string;
  /** Emoji celebration line */
  celebration?: string;
  /** Number of moves (omit to hide) */
  moves?: number;
  /** Score value (omit to hide) */
  score?: number;
  /** Status message below stats, e.g. "Score saved for Mason!" */
  message?: string;
}

export function WinBadge({
  visible,
  onClose,
  title,
  celebration = '🎉🏆🎉',
  moves,
  score,
  message,
}: WinBadgeProps) {
  if (!visible) return null;

  return (
    <Box className={styles.overlay}>
      <IconButton
        className={styles.closeBtn}
        onClick={onClose}
        sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}
        aria-label="Close results"
      >
        <CloseIcon />
      </IconButton>

      <Box className={styles.celebration}>{celebration}</Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#fff' }}>
        {title}
      </Typography>

      {(moves !== undefined || score !== undefined) && (
        <Box className={styles.statsRow}>
          {moves !== undefined && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                {moves}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Moves
              </Typography>
            </Box>
          )}
          {score !== undefined && (
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEventsIcon sx={{ fontSize: 28, color: '#DAA520', verticalAlign: 'middle' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff' }}>
                {score}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Score
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {message && (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
