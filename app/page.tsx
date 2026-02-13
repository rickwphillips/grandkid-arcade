'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Fade,
  Chip,
  Avatar,
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { DarkModeToggle } from './components/DarkModeToggle';
import { LogoutButton } from './components/LogoutButton';
import { useAuth } from './components/AuthGuard';
import { EmptyState } from './components/EmptyState';
import { GameCard } from './components/GameCard';
import { useGrandkid } from './lib/useGrandkid';
import { games } from './lib/gameRegistry';
import { APP_VERSION } from './lib/version';
import styles from './page.module.scss';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { grandkids, selected, selectGrandkid, loading } = useGrandkid();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const visibleGames = games;

  return (
    <>
      <LogoutButton />
      <DarkModeToggle />
      <Container maxWidth="lg">
        {/* Hero */}
        <Fade in={mounted} timeout={800}>
          <Box className={styles.heroSection}>
            <Typography
              variant="h2"
              className={styles.heroTitle}
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #FF8C00 0%, #DAA520 100%)'
                    : 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Grandkid Games
            </Typography>
            <Typography variant="body1" color="text.secondary" className={styles.heroSubtitle}>
              Pick a player, pick a game, have fun!
            </Typography>
          </Box>
        </Fade>

        {/* Grandkid selector */}
        <Fade in={mounted} timeout={1000}>
          <Box className={styles.selectorBar}>
            <Typography variant="subtitle2" color="text.secondary">
              Playing as:
            </Typography>
            {!loading &&
              grandkids.map((kid) => (
                <Chip
                  key={kid.id}
                  avatar={
                    <Avatar sx={{ bgcolor: kid.avatar_color || 'primary.main' }}>
                      {kid.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={kid.name}
                  variant={selected?.id === kid.id ? 'filled' : 'outlined'}
                  color={selected?.id === kid.id ? 'primary' : 'default'}
                  onClick={() => selectGrandkid(kid.id)}
                />
              ))}
            {!loading && grandkids.length === 0 && (
              <Chip
                label="Add grandkids first"
                variant="outlined"
                component={Link}
                href="/grandkids/"
                clickable
              />
            )}
            {user?.role === 'admin' && (
              <Chip
                icon={<SettingsIcon />}
                label="Admin"
                variant="outlined"
                component={Link}
                href="/admin/puzzle-images/"
                clickable
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
        </Fade>

        {/* Game grid */}
        <Fade in={mounted} timeout={1200}>
          <Box>
            {visibleGames.length > 0 ? (
              <Box className={styles.gameGrid}>
                {visibleGames.map((game) => (
                  <GameCard key={game.slug} game={game} />
                ))}
              </Box>
            ) : (
              <EmptyState
                icon={<SportsEsportsIcon sx={{ fontSize: 64 }} />}
                title="No games yet"
                description="Games will appear here as they're added. Check back soon!"
              />
            )}
          </Box>
        </Fade>

        {/* Version footer */}
        <Fade in={mounted} timeout={1400}>
          <Box sx={{ textAlign: 'center', py: 4, mt: 2 }}>
            <Typography
              variant="caption"
              component={Link}
              href="/changelog/"
              sx={{
                color: 'text.disabled',
                textDecoration: 'none',
                '&:hover': { color: 'text.secondary', textDecoration: 'underline' },
              }}
            >
              v{APP_VERSION}
            </Typography>
          </Box>
        </Fade>
      </Container>
    </>
  );
}
