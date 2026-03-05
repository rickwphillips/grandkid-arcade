'use client';

import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import Link from 'next/link';
import type { GameDefinition } from '../lib/gameRegistry';

interface GameCardProps {
  game: GameDefinition;
}

const categoryColors: Record<GameDefinition['category'], string> = {
  puzzle: '#6A5ACD',
  action: '#DC143C',
  creative: '#20B2AA',
  educational: '#DAA520',
};

export function GameCard({ game }: GameCardProps) {
  return (
    <Card
      component={Link}
      href={`/games/${game.slug}/`}
      sx={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        '&:hover .game-emoji': {
          transform: 'scale(1.2)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Typography
            className="game-emoji"
            sx={{ fontSize: 36, transition: 'transform 0.2s', lineHeight: 1 }}
          >
            {game.emoji}
          </Typography>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {game.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ages {game.ageRange[0]}+
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {game.description}
        </Typography>

        <Chip
          label={game.category}
          size="small"
          sx={{
            backgroundColor: categoryColors[game.category],
            color: '#fff',
            fontWeight: 500,
            textTransform: 'capitalize',
          }}
        />
      </CardContent>
    </Card>
  );
}
