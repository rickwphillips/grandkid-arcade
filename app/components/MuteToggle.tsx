'use client';

import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { isMuted, toggleMuted } from '@/app/lib/mute';

export function MuteToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isMuted());
  }, []);

  const handleToggle = () => {
    const next = toggleMuted();
    setMuted(next);
  };

  return (
    <Tooltip title={muted ? 'Unmute sounds' : 'Mute sounds'}>
      <IconButton
        onClick={handleToggle}
        color="inherit"
        aria-label="toggle sound"
        sx={{
          position: 'fixed',
          top: 24,
          right: 72,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s',
        }}
      >
        {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </IconButton>
    </Tooltip>
  );
}
