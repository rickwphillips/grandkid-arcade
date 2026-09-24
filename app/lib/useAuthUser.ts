'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { getValidToken, subscribeAuth, userFromToken, type AuthUser } from './auth';

/**
 * The signed-in user, read from the stored token as an external store.
 * `known` is false during server rendering and hydration, when the token cannot
 * be read, and true once the client value is available.
 */
export function useAuthUser(): { user: AuthUser | null; known: boolean } {
  const token = useSyncExternalStore<string | null | undefined>(subscribeAuth, getValidToken, () => undefined);
  const user = useMemo(() => (token ? userFromToken(token) : null), [token]);
  return { user, known: token !== undefined };
}
