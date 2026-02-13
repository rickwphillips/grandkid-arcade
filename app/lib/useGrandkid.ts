'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Grandkid } from './types';
import { api } from './api';

const STORAGE_KEY = 'selectedGrandkidId';

export function useGrandkid() {
  const [grandkids, setGrandkids] = useState<Grandkid[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load grandkids list and restore selection from localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await api.getGrandkids();
        if (cancelled) return;
        setGrandkids(list);

        // Restore saved selection
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const id = Number(savedId);
          if (list.some((g) => g.id === id)) {
            setSelectedId(id);
          } else if (list.length > 0) {
            setSelectedId(list[0].id);
          }
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load grandkids');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const selectGrandkid = useCallback((id: number) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const selected = grandkids.find((g) => g.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const list = await api.getGrandkids();
      setGrandkids(list);
    } catch {
      // silently fail on refresh — stale data is acceptable
    }
  }, []);

  return {
    grandkids,
    selected,
    selectedId,
    selectGrandkid,
    loading,
    error,
    refresh,
  };
}
