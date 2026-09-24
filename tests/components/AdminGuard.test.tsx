import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminGuard, useAdmin } from '@/app/components/AdminGuard';

const AUTH_TOKEN_KEY = 'auth_token';

function buildToken(role: 'admin' | 'user', exp = Math.floor(Date.now() / 1000) + 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ sub: '7', username: role, display_name: 'Tester', role, exp }));
  return `${header}.${body}.sig`;
}

let location: { href: string; pathname: string; search: string };

beforeEach(() => {
  localStorage.clear();
  location = { href: 'http://localhost:3002/admin', pathname: '/admin', search: '' };
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: location });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminGuard', () => {
  it('renders children and exposes the user for an admin', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, buildToken('admin'));
    function Name() {
      return <div>{useAdmin().user?.username}</div>;
    }
    render(<AdminGuard><Name /></AdminGuard>);
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument());
  });

  it('sends a signed-in non-admin home without rendering children', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, buildToken('user'));
    render(<AdminGuard><div>Secret</div></AdminGuard>);
    await waitFor(() => expect(location.href).not.toContain('localhost:3002/admin'));
    expect(location.href).not.toContain('login');
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('sends a signed-out visitor to login', async () => {
    render(<AdminGuard><div>Secret</div></AdminGuard>);
    await waitFor(() => expect(location.href).toContain('login'));
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('admits an admin whose token arrives in the URL, without a login redirect', async () => {
    const t = buildToken('admin');
    location.search = `?token=${t}`;
    location.href = `http://localhost:3002/admin?token=${t}`;
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    render(<AdminGuard><div>Secret</div></AdminGuard>);
    await waitFor(() => expect(screen.getByText('Secret')).toBeInTheDocument());
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(t);
    expect(location.href).not.toContain('login');
  });
});
