import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard, useAuth } from '@/app/components/AuthGuard';
import { renderHook } from '@testing-library/react';

const AUTH_TOKEN_KEY = 'auth_token';

// Build a minimal HS256-style JWT with the given payload and exp
function buildToken(payload: Record<string, unknown>, exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.fake-sig`;
}

function validToken() {
  return buildToken(
    { sub: '42', username: 'admin', display_name: 'Admin User', role: 'admin' },
    Math.floor(Date.now() / 1000) + 3600,
  );
}

function expiredToken() {
  return buildToken(
    { sub: '42', username: 'admin', display_name: 'Admin User', role: 'admin' },
    Math.floor(Date.now() / 1000) - 100,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Prevent actual redirects from throwing during tests
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost:3002', pathname: '/', search: '', history: window.history },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when valid non-expired token is in localStorage', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, validToken());
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('does not render children when no token is present (redirects)', async () => {
    // No token — checking state stays true and redirect fires
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    // After useEffect, should redirect — children should not be shown
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('does not render children when token is expired', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, expiredToken());
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('reads ?token= URL param, stores in localStorage, and removes from URL', async () => {
    const token = validToken();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        href: `http://localhost:3002/?token=${token}`,
        pathname: '/',
        search: `?token=${token}`,
        history: window.history,
      },
    });
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );
    await waitFor(() => {
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(token);
    });
    expect(replaceSpy).toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('returns user object from valid JWT payload when rendered inside AuthGuard', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, validToken());

    function TestComponent() {
      const { user } = useAuth();
      if (!user) return <div>no user</div>;
      return <div>{user.username}</div>;
    }

    render(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });
});
