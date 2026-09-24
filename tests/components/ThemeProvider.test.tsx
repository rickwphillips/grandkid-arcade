import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useThemeMode } from '@/app/components/ThemeProvider';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

function prefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  prefersDark(false);
});

describe('ThemeProvider', () => {
  it('uses the saved mode', () => {
    localStorage.setItem('themeMode', 'dark');
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe('dark');
  });

  it('falls back to the OS colour scheme, ignoring invalid saved values', () => {
    prefersDark(true);
    localStorage.setItem('themeMode', 'purple');
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe('dark');
  });

  it('toggleTheme switches the mode and persists it', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('light');
  });
});
