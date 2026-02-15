'use client';

import { Box, Typography, Chip } from '@mui/material';
import { PageContainer } from '@/app/components/PageContainer';
import { APP_VERSION } from '@/app/lib/version';

interface Change {
  icon: string;
  text: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: Change[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-02-15',
    title: 'Game Settings',
    changes: [
      { icon: '🔇', text: 'Toggle love messages on/off per device from the admin page' },
      { icon: '🎈', text: 'Toggle floating icons (hearts, balloons) on/off per device' },
      { icon: '💾', text: 'Settings persist in browser localStorage — no login required' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-15',
    title: 'Slide Puzzle Solver',
    changes: [
      { icon: '🪄', text: 'Solve button auto-solves 3x3, 4x4, and 5x5 puzzles with animated tile moves' },
      { icon: '⏹️', text: 'Cancel solve mid-animation to resume playing manually' },
      { icon: '🏅', text: 'Win badge overlays the completed puzzle — dismiss to admire your work' },
      { icon: '👀', text: 'Hint and Solve buttons hidden by default — reveal with Show Hint' },
      { icon: '🚫', text: 'Auto-solved puzzles skip score submission' },
      { icon: '📋', text: 'Image selection changed to a dropdown list' },
      { icon: '📱', text: 'Slide Puzzle and Picture Matcher scale to fit any screen size' },
      { icon: '🧩', text: 'Shared WinBadge component — consistent win overlay across all games' },
      { icon: '🃏', text: 'Hard mode Picture Matcher uses 6-column grid to fit phone screens' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-13',
    title: 'Picture Matcher & Difficulty',
    changes: [
      { icon: '🖼️', text: 'Renamed Color Match to Picture Matcher' },
      { icon: '🎚️', text: 'Three difficulty levels: Easy (6 pairs), Medium (8 pairs), Hard (12 pairs)' },
      { icon: '🃏', text: 'Difficulty select screen before each game with New Game button' },
      { icon: '👶', text: 'Age range expanded to 3-18 for all skill levels' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-13',
    title: 'Connect 4 & Image Cards',
    changes: [
      { icon: '🔴', text: 'Added Connect 4 — play against the computer or a friend' },
      { icon: '🤖', text: 'Simple AI opponent that blocks wins and plays strategically' },
      { icon: '🎯', text: 'Realistic piece drop animation with board mask effect' },
      { icon: '🖼️', text: 'Color Match now uses uploaded puzzle images as card faces' },
      { icon: '🃏', text: 'Remaining card pairs filled with emoji fallbacks' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-13',
    title: 'Love Messages & Color Match',
    changes: [
      { icon: '💌', text: 'Added floating love messages from Grampy during gameplay' },
      { icon: '👦👧', text: 'Personalized messages for Mason and Ella-Grace' },
      { icon: '🐶', text: 'Messages from Copper, Penny, Lulu, Luna & Stella' },
      { icon: '🎈', text: 'Floating hearts and balloons during play' },
      { icon: '🃏', text: 'Added Color Match memory card game' },
      { icon: '🧩', text: 'Added Slide Puzzle with custom image uploads' },
      { icon: '👶', text: 'Grandkid selector with age-filtered games' },
      { icon: '🏆', text: 'Score tracking and favorites' },
      { icon: '🌙', text: 'Dark mode support' },
      { icon: '📋', text: 'Version number and changelog page' },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <PageContainer title="Changelog" subtitle={`Current version: v${APP_VERSION}`}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {changelog.map((entry) => (
          <Box
            key={entry.version}
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`v${entry.version}`}
                size="small"
                color={entry.version === APP_VERSION ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {entry.title}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                {entry.date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {entry.changes.map((change, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Box sx={{ fontSize: '0.9rem', flexShrink: 0, width: 24, textAlign: 'center' }}>
                    {change.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {change.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </PageContainer>
  );
}
