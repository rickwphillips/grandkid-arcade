'use client';

import { Container, Box, Typography, Fade, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useEffect, useState, ReactNode } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { LogoutButton } from './LogoutButton';
import { MuteToggle } from './MuteToggle';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back',
  children,
  actions,
}: PageContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LogoutButton />
      <MuteToggle />
      <DarkModeToggle />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          component={Link}
          href={backHref}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          {backLabel}
        </Button>

        <Fade in={mounted} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: subtitle ? 1 : 0,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #FF8C00 0%, #DAA520 100%)'
                        : 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body1" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {actions && <Box>{actions}</Box>}
            </Box>
          </Box>
        </Fade>

        <Fade in={mounted} timeout={1000}>
          <Box>{children}</Box>
        </Fade>
      </Container>
    </>
  );
}
