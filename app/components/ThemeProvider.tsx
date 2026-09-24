'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

const MODE_KEY = 'themeMode';
const DARK_QUERY = '(prefers-color-scheme: dark)';
/** Fired on this tab when the mode is saved; other tabs get `storage`. */
const MODE_EVENT = 'theme-mode-change';

// The mode is an external store (localStorage plus the OS colour scheme), read
// with useSyncExternalStore instead of being copied into state by an effect.
function subscribeMode(onChange: () => void): () => void {
  window.addEventListener(MODE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
  media?.addEventListener('change', onChange);
  return () => {
    window.removeEventListener(MODE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
    media?.removeEventListener('change', onChange);
  };
}

function readMode(): ThemeMode {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

// True only once rendering on the client (false for the server pass and
// hydration), with no effect needed.
const subscribeNothing = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(subscribeNothing, onClient, onServer);
  const mode = useSyncExternalStore(subscribeMode, readMode, (): ThemeMode => 'light');

  const toggleTheme = () => {
    localStorage.setItem(MODE_KEY, mode === 'light' ? 'dark' : 'light');
    window.dispatchEvent(new Event(MODE_EVENT));
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Prevent a flash of the wrong theme: render nothing until on the client.
  if (!isClient) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
