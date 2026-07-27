import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';

// Mock the api module before importing the hook
vi.mock('@/app/lib/api', () => ({
  api: {
    getGrandkids: vi.fn(),
  },
}));

import { useGrandkid } from '@/app/lib/useGrandkid';
import { api } from '@/app/lib/api';

const mockGrandkids = [
  { id: 1, name: 'Alice', age: 7, interests: [], avatar_color: '#f00', created_at: '2024-01-01' },
  { id: 2, name: 'Bob', age: 10, interests: [], avatar_color: '#00f', created_at: '2024-01-01' },
];

const STORAGE_KEY = 'selectedGrandkidId';

describe('useGrandkid', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('calls api.getGrandkids on mount', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    renderHook(() => useGrandkid());
    await waitFor(() => {
      expect(api.getGrandkids).toHaveBeenCalledTimes(1);
    });
  });

  it('loading is true initially, false after fetch', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('restores selected from localStorage if ID matches a returned grandkid', async () => {
    localStorage.setItem(STORAGE_KEY, '2');
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.selectedId).toBe(2);
    expect(result.current.selected?.name).toBe('Bob');
  });

  it('falls back to first grandkid if stored ID not in returned list', async () => {
    localStorage.setItem(STORAGE_KEY, '999');
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.selectedId).toBe(1);
    expect(result.current.selected?.name).toBe('Alice');
  });

  it('selectGrandkid updates state and persists to localStorage', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    act(() => {
      result.current.selectGrandkid(2);
    });
    expect(result.current.selectedId).toBe(2);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('2');
  });

  it('sets error string on fetch failure', async () => {
    vi.mocked(api.getGrandkids).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });

  it('refresh re-fetches and replaces the grandkids list', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = [
      { id: 3, name: 'Cara', age: 5, interests: [], avatar_color: '#0f0', created_at: '2024-01-01' },
    ];
    vi.mocked(api.getGrandkids).mockResolvedValue(updated);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.grandkids).toEqual(updated);
  });

  it('leaves selection null when no grandkids are returned', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue([]);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.selectedId).toBeNull();
  });

  it('leaves selection null when a saved id exists but the list is empty', async () => {
    localStorage.setItem(STORAGE_KEY, '2');
    vi.mocked(api.getGrandkids).mockResolvedValue([]);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.selectedId).toBeNull();
  });

  it('refresh silently keeps existing data when the re-fetch fails', async () => {
    vi.mocked(api.getGrandkids).mockResolvedValue(mockGrandkids);
    const { result } = renderHook(() => useGrandkid());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(api.getGrandkids).mockRejectedValue(new Error('offline'));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.grandkids).toEqual(mockGrandkids);
  });
});
