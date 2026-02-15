'use client';

import { useState, useCallback } from 'react';

const LOVE_MESSAGES_KEY = 'setting_love_messages';
const FLOATING_ICONS_KEY = 'setting_floating_icons';

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
}

export function useSettings() {
  const [loveMessages, setLoveMessagesState] = useState(() => readBool(LOVE_MESSAGES_KEY, true));
  const [floatingIcons, setFloatingIconsState] = useState(() => readBool(FLOATING_ICONS_KEY, true));

  const setLoveMessages = useCallback((value: boolean) => {
    setLoveMessagesState(value);
    localStorage.setItem(LOVE_MESSAGES_KEY, String(value));
  }, []);

  const setFloatingIcons = useCallback((value: boolean) => {
    setFloatingIconsState(value);
    localStorage.setItem(FLOATING_ICONS_KEY, String(value));
  }, []);

  return { loveMessages, floatingIcons, setLoveMessages, setFloatingIcons };
}
