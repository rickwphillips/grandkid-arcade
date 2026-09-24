import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AUTH_TOKEN_KEY, clearToken, getValidToken, isTokenExpired, storeToken, userFromToken } from '@/app/lib/auth';

function b64url(obj: object): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function token(payload: object): string {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

const future = Math.floor(Date.now() / 1000) + 3600;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('token decoding', () => {
  it('decodes base64url payloads that plain atob rejects', () => {
    // "??>" encodes to "Pz8-" in base64url; standard atob throws on "-".
    const t = token({ sub: '1', username: 'a', display_name: '??>', role: 'user', exp: future });
    expect(t.split('.')[1]).toMatch(/[-_]/);
    expect(isTokenExpired(t)).toBe(false);
    expect(userFromToken(t)?.display_name).toBe('??>');
  });

  it('treats malformed and expired tokens as expired', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
    expect(isTokenExpired(token({ exp: Math.floor(Date.now() / 1000) - 10 }))).toBe(true);
    expect(isTokenExpired(token({ sub: '1' }))).toBe(true);
  });
});

describe('token storage', () => {
  it('getValidToken ignores expired tokens', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, token({ exp: Math.floor(Date.now() / 1000) - 10 }));
    expect(getValidToken()).toBeNull();
  });

  it('storeToken and clearToken notify listeners', () => {
    const listener = vi.fn();
    window.addEventListener('auth-token-change', listener);
    storeToken(token({ exp: future }));
    clearToken();
    window.removeEventListener('auth-token-change', listener);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
