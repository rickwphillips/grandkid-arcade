import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '@/app/lib/useSettings';

const LOVE_KEY = 'setting_love_messages';
const FLOAT_KEY = 'setting_floating_icons';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults loveMessages and floatingIcons to true when storage is empty', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.loveMessages).toBe(true);
    expect(result.current.floatingIcons).toBe(true);
  });

  it('setLoveMessages(false) updates state', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setLoveMessages(false);
    });
    expect(result.current.loveMessages).toBe(false);
  });

  it('setLoveMessages(false) persists to localStorage', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setLoveMessages(false);
    });
    expect(localStorage.getItem(LOVE_KEY)).toBe('false');
  });

  it('setFloatingIcons(false) updates state', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setFloatingIcons(false);
    });
    expect(result.current.floatingIcons).toBe(false);
  });

  it('setFloatingIcons(false) persists to localStorage', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setFloatingIcons(false);
    });
    expect(localStorage.getItem(FLOAT_KEY)).toBe('false');
  });

  it('restores loveMessages false from localStorage on render', () => {
    localStorage.setItem(LOVE_KEY, 'false');
    const { result } = renderHook(() => useSettings());
    expect(result.current.loveMessages).toBe(false);
  });

  it('restores floatingIcons false from localStorage on render', () => {
    localStorage.setItem(FLOAT_KEY, 'false');
    const { result } = renderHook(() => useSettings());
    expect(result.current.floatingIcons).toBe(false);
  });
});
