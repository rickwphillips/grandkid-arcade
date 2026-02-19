'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const AUTH_TOKEN_KEY = 'auth_token';
const isDev = process.env.NODE_ENV === 'development';
const LOGIN_URL = isDev
  ? 'http://localhost:3000/app/login/'
  : '/app/login/';
const HOME_URL = isDev ? '/' : '/app/projects/grandkid-games/';

interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

interface AdminContextType {
  user: AuthUser | null;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

function getUserFromToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      username: payload.username,
      display_name: payload.display_name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    const currentPath = window.location.href;
    window.location.href = `${LOGIN_URL}?logout=1&redirect=${encodeURIComponent(currentPath)}`;
  };

  useEffect(() => {
    // Check for token passed via URL param (needed for cross-origin dev flow)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, urlToken);
      params.delete('token');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    const token = urlToken || localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token || isTokenExpired(token)) {
      const currentPath = window.location.href;
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      logout();
      return;
    }

    // Admin role check — redirect non-admins to home
    if (tokenUser.role !== 'admin') {
      window.location.href = HOME_URL;
      return;
    }

    setUser(tokenUser);
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
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
