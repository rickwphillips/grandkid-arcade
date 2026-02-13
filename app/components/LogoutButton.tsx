'use client';

import { IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './AuthGuard';

export function LogoutButton() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Tooltip title={`Sign out (${user.display_name})`}>
      <IconButton
        onClick={logout}
        color="inherit"
        aria-label="sign out"
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
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  );
}
