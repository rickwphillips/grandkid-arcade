import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiFetch, api, API_BASE } from '@/app/lib/api';

const AUTH_TOKEN_KEY = 'auth_token';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes Authorization header when token is set', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'test-token');
    const fetchMock = mockFetch(200, { data: 'ok' });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('grandkids');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('omits Authorization header when no token', async () => {
    const fetchMock = mockFetch(200, { data: 'ok' });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('grandkids');
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('throws on non-ok response (500)', async () => {
    vi.stubGlobal('fetch', mockFetch(500, { error: 'Server error' }));
    await expect(apiFetch('grandkids')).rejects.toThrow('Server error');
  });

  it('inserts .php before query string', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('scores?id=1');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}scores.php?id=1`);
  });

  it('appends .php for endpoint without query string', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('grandkids');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php`);
  });

  it('strips leading slash from endpoint', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('/grandkids');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php`);
  });

  it('clears localStorage token on 401 and throws', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'old-token');
    vi.stubGlobal('fetch', mockFetch(401, { error: 'Unauthorized' }));
    // Mock window.location.href setter to prevent actual redirect
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: 'http://localhost:3002',
    } as Location);

    await expect(apiFetch('grandkids')).rejects.toThrow('Authentication required');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    locationSpy.mockRestore();
  });
});

describe('api methods', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('api.getGrandkids calls correct endpoint', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getGrandkids();
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php`);
  });

  it('api.submitScore POSTs with correct JSON body', async () => {
    const fetchMock = mockFetch(200, { id: 1 });
    vi.stubGlobal('fetch', fetchMock);
    const data = { grandkid_id: 1, game_slug: 'connect-4', score: 100, completed: true };
    await api.submitScore(data);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}scores.php`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });
});
