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
