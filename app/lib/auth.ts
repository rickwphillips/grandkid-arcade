/**
 * Auth token handling shared by AuthGuard, AdminGuard and the API client.
 *
 * The token is issued by the portfolio's login page and stored in localStorage
 * under a key both apps share. The client only decodes it to decide what to
 * render; the API verifies it on every request.
 */

export const AUTH_TOKEN_KEY = 'auth_token';

const isDev = process.env.NODE_ENV === 'development';

/** Login page URL (lives in the portfolio site). */
export const LOGIN_URL = isDev ? 'http://localhost:3000/app/login/' : '/app/login/';

/** Fired on this tab when the stored token changes; other tabs get `storage`. */
const AUTH_CHANGE_EVENT = 'auth-token-change';

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

/**
 * Decode a JWT payload without verifying it. JWT segments are base64url
 * (`-`, `_`, no padding) while `atob` expects standard base64 and throws on
 * those characters, so the segment is normalized first.
 */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(seg));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  return !payload || typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000;
}

export function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const payload = decodePayload(token);
  if (!payload) return null;
  return {
    id: payload.sub as string,
    username: payload.username as string,
    display_name: payload.display_name as string,
    role: payload.role as AuthUser['role'],
  };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * The stored token when present and unexpired, else null. A string rather than
 * a decoded object so `useSyncExternalStore` can compare snapshots by value.
 */
export function getValidToken(): string | null {
  const token = getToken();
  return token && !isTokenExpired(token) ? token : null;
}

function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function storeToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyAuthChange();
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyAuthChange();
}

/** Subscribe to token changes in this tab, other tabs, and on window focus. */
export function subscribeAuth(onChange: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
    window.removeEventListener('focus', onChange);
  };
}

/**
 * Accept a token handed over as `?token=` (the cross-origin dev login flow),
 * store it, and strip it from the URL so it does not linger in history.
 */
export function consumeUrlToken(): void {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (!urlToken) return;
  params.delete('token');
  const cleanUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);
  storeToken(urlToken);
}

export function redirectToLogin(opts: { logout?: boolean } = {}): void {
  const redirect = encodeURIComponent(window.location.href);
  window.location.href = `${LOGIN_URL}?${opts.logout ? 'logout=1&' : ''}redirect=${redirect}`;
}
