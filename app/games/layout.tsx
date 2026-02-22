'use client';

import { Box } from '@mui/material';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at 20% 10%, rgba(139,69,19,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(218,165,32,0.12) 0%, transparent 60%), #1a1410'
            : 'radial-gradient(ellipse at 20% 10%, rgba(210,105,30,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(218,165,32,0.1) 0%, transparent 60%), #fff8f0',
      }}
    >
      {children}
    </Box>
  );
}
