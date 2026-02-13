const STORAGE_KEY = 'sound_muted';

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setMuted(muted: boolean) {
  localStorage.setItem(STORAGE_KEY, String(muted));
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}
