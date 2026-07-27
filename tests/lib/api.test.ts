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
    vi.unstubAllGlobals();
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

  it('omits auth headers when running server-side (no window)', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tkn');
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', undefined);

    await apiFetch('grandkids');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('skips the redirect server-side on 401 but still throws', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { error: 'Unauthorized' }));
    vi.stubGlobal('window', undefined);

    await expect(apiFetch('grandkids')).rejects.toThrow('Authentication required');
  });

  it('falls back to a generic message when the error body has no error field', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    await expect(apiFetch('grandkids')).rejects.toThrow('Request failed');
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: () => Promise.reject(new Error('not json')),
      })
    );
    await expect(apiFetch('grandkids')).rejects.toThrow('Request failed');
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

  it('api.getGrandkid requests a single grandkid by id', async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await api.getGrandkid(5);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}grandkids.php?id=5`);
  });

  it('api.createGrandkid POSTs the input body', async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    const data = { name: 'Cara', age: 6 };
    await api.createGrandkid(data);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('api.updateGrandkid PUTs by id', async () => {
    const fetchMock = mockFetch(200, { success: true });
    vi.stubGlobal('fetch', fetchMock);
    await api.updateGrandkid(3, { name: 'New' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php?id=3`);
    expect(options.method).toBe('PUT');
  });

  it('api.deleteGrandkid DELETEs by id', async () => {
    const fetchMock = mockFetch(200, { success: true });
    vi.stubGlobal('fetch', fetchMock);
    await api.deleteGrandkid(3);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}grandkids.php?id=3`);
    expect(options.method).toBe('DELETE');
  });

  it('api.getScores builds no query string when no filters are given', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getScores();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}scores.php`);
  });

  it('api.getScores includes both filters when provided', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getScores(1, 'connect-4');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('grandkid_id=1');
    expect(url).toContain('game_slug=connect-4');
  });

  it('api.getFavorites requests by grandkid id', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getFavorites(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}favorites.php?grandkid_id=2`);
  });

  it('api.toggleFavorite POSTs the input body', async () => {
    const fetchMock = mockFetch(200, { favorited: true });
    vi.stubGlobal('fetch', fetchMock);
    await api.toggleFavorite({ grandkid_id: 1, game_slug: 'hangman' });
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('api.getPuzzleImages / getPuzzleImage hit the puzzle-images endpoint', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getPuzzleImages();
    await api.getPuzzleImage(4);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}puzzle-images.php`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE}puzzle-images.php?id=4`);
  });

  it('api.createPuzzleImage POSTs and deletePuzzleImage DELETEs', async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await api.createPuzzleImage({ title: 'T', image_data: 'data:...' });
    await api.deletePuzzleImage(9);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
    expect(fetchMock.mock.calls[1][0]).toContain('id=9');
  });

  it('api.getLoveMessages omits the name query when no name is given', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getLoveMessages();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}love-messages.php`);
  });

  it('api.getLoveMessages includes the name query when provided', async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await api.getLoveMessages('Alice');
    expect(fetchMock.mock.calls[0][0]).toContain('name=Alice');
  });

  it('api hangman-words methods target the right endpoint and verbs', async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await api.getRandomWord('easy');
    await api.getHangmanWords();
    await api.createHangmanWord({ word: 'cat', difficulty: 'easy' });
    await api.deleteHangmanWord(2);
    expect(fetchMock.mock.calls[0][0]).toContain('difficulty=easy');
    expect(fetchMock.mock.calls[0][0]).toContain('random=1');
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE}hangman-words.php`);
    expect(fetchMock.mock.calls[2][1].method).toBe('POST');
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE');
  });

  it('api word-search-themes methods target the right endpoint and verbs', async () => {
    const fetchMock = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchMock);
    await api.getWordSearchThemes();
    await api.getWordSearchTheme(1);
    await api.createWordSearchTheme({ title: 'Animals', difficulty: 'easy', emoji: '🐶' });
    await api.deleteWordSearchTheme(1);
    await api.addWordSearchWord(1, 'dog');
    await api.deleteWordSearchWord(7);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}word-search-themes.php`);
    expect(fetchMock.mock.calls[1][0]).toContain('id=1');
    expect(fetchMock.mock.calls[2][1].method).toBe('POST');
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE');
    expect(fetchMock.mock.calls[4][0]).toContain('words=1');
    expect(fetchMock.mock.calls[5][0]).toContain('word_id=7');
  });
});
