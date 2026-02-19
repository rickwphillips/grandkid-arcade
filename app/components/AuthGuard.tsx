'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const AUTH_TOKEN_KEY = 'auth_token';
const LOGIN_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/app/login/'
  : '/app/login/';

interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

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

export function AuthGuard({ children }: { children: ReactNode }) {
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
      // Clean token from URL without reload
      params.delete('token');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    const token = urlToken || localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token || isTokenExpired(token)) {
      // No valid token - redirect to login
      const currentPath = window.location.href;
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      logout();
      return;
    }

    setUser(tokenUser);
    setChecking(false);
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
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
