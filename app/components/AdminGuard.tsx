'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { clearToken, consumeUrlToken, getValidToken, redirectToLogin, userFromToken, type AuthUser } from '../lib/auth';
import { useAuthUser } from '../lib/useAuthUser';

const isDev = process.env.NODE_ENV === 'development';
const HOME_URL = isDev ? '/' : '/app/projects/grandkid-games/';

interface AdminContextType {
  user: AuthUser | null;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

/** Renders its children only for a signed-in admin; see {@link AuthGuard}. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, known } = useAuthUser();

  const logout = () => {
    clearToken();
    redirectToLogin({ logout: true });
  };

  useEffect(() => {
    consumeUrlToken();
  }, []);

  // Redirect once the token can be read: signed out to login, non-admins home.
  // Reads the store directly for the same reason as AuthGuard.
  useEffect(() => {
    if (!known) return;
    const current = userFromToken(getValidToken());
    if (!current) redirectToLogin();
    else if (current.role !== 'admin') window.location.href = HOME_URL;
  }, [known, user]);

  if (user?.role !== 'admin') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Checking admin access...
        </Typography>
      </Box>
    );
  }

  return (
    <AdminContext.Provider value={{ user, logout }}>
      {children}
    </AdminContext.Provider>
  );
}
