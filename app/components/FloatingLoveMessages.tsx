'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import { useThemeMode } from '@/app/components/ThemeProvider';
import { api } from '@/app/lib/api';
import type { LoveMessage } from '@/app/lib/types';
import styles from './FloatingLoveMessages.module.scss';

interface ActiveMessage {
  key: number;
  text: string;
  side: 'left' | 'right';
  top: string;
  offset: number;
}

interface FloatingDeco {
  key: number;
  emoji: string;
  left: string;
  delay: string;
  duration: string;
}

const DECO_EMOJIS = ['❤️', '🎈', '💛', '🎈', '♥', '🩷', '🎈', '💕'];

interface FloatingLoveMessagesProps {
  /** Grandkid name to substitute for {name} */
  name: string;
  /** Whether messages should be actively showing (e.g. during play phase) */
  active: boolean;
}

const MESSAGE_DURATION = 7000; // matches CSS animation duration
const MIN_INTERVAL = 8000;
const MAX_INTERVAL = 12000;
const DECO_INTERVAL = 4000;
const DECO_DURATION = 6000;

export function FloatingLoveMessages({ name, active }: FloatingLoveMessagesProps) {
  const { mode } = useThemeMode();
  const [messages, setMessages] = useState<LoveMessage[]>([]);
  const [activeMessages, setActiveMessages] = useState<ActiveMessage[]>([]);
  const [decos, setDecos] = useState<FloatingDeco[]>([]);
  const keyRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndexRef = useRef(-1);

  // Fetch messages (universal + exclusive to this grandkid)
  useEffect(() => {
    let cancelled = false;
    api.getLoveMessages(name).then((list) => {
      if (!cancelled) setMessages(list);
    }).catch(() => {
      // Non-critical
    });
    return () => { cancelled = true; };
  }, [name]);

  const spawnMessage = useCallback(() => {
    if (messages.length === 0) return;

    // Pick a random message, avoiding the last one shown
    let idx: number;
    do {
      idx = Math.floor(Math.random() * messages.length);
    } while (idx === lastIndexRef.current && messages.length > 1);
    lastIndexRef.current = idx;

    const text = messages[idx].message.replace(/\{name\}/g, name);
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const top = `${5 + Math.random() * 80}%`;
    const offset = 4 + Math.random() * 30;
    const key = ++keyRef.current;

    setActiveMessages((prev) => [...prev, { key, text, side, top, offset }]);

    // Remove after animation completes
    setTimeout(() => {
      setActiveMessages((prev) => prev.filter((m) => m.key !== key));
    }, MESSAGE_DURATION);
  }, [messages, name]);

  // Schedule messages while active
  useEffect(() => {
    if (!active || messages.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    function scheduleNext() {
      const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
      timerRef.current = setTimeout(() => {
        spawnMessage();
        scheduleNext();
      }, delay);
    }

    // Show first message after a short initial delay
    timerRef.current = setTimeout(() => {
      spawnMessage();
      scheduleNext();
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, messages.length, spawnMessage]);

  // Spawn floating balloons & hearts while active
  useEffect(() => {
    if (!active) {
      if (decoTimerRef.current) clearTimeout(decoTimerRef.current);
      setDecos([]);
      return;
    }

    function spawnDeco() {
      const emoji = DECO_EMOJIS[Math.floor(Math.random() * DECO_EMOJIS.length)];
      const left = `${5 + Math.random() * 90}%`;
      const duration = `${5 + Math.random() * 3}s`;
      const delay = `${Math.random() * 0.5}s`;
      const key = ++keyRef.current;

      setDecos((prev) => [...prev, { key, emoji, left, duration, delay }]);
      setTimeout(() => {
        setDecos((prev) => prev.filter((d) => d.key !== key));
      }, DECO_DURATION);
    }

    // Spawn a few right away with stagger
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnDeco, i * 1500);
    }

    function scheduleNextDeco() {
      const jitter = 2000 + Math.random() * 3000;
      decoTimerRef.current = setTimeout(() => {
        spawnDeco();
        scheduleNextDeco();
      }, DECO_INTERVAL + jitter);
    }
    scheduleNextDeco();

    return () => {
      if (decoTimerRef.current) clearTimeout(decoTimerRef.current);
    };
  }, [active]);

  // Clear active messages when deactivated
  useEffect(() => {
    if (!active) setActiveMessages([]);
  }, [active]);

  if (activeMessages.length === 0 && decos.length === 0) return null;

  return (
    <Box className={styles.container} sx={{ position: 'absolute', zIndex: 2 }}>
      {decos.map((d) => (
        <Box
          key={d.key}
          className={styles.deco}
          sx={{
            left: d.left,
            animationDuration: d.duration,
            animationDelay: d.delay,
          }}
        >
          {d.emoji}
        </Box>
      ))}
      {activeMessages.map((msg) => (
        <Box
          key={msg.key}
          className={`${styles.message} ${msg.side === 'left' ? styles.messageLeft : styles.messageRight} ${mode === 'dark' ? styles.messageDark : ''}`}
          sx={{
            [msg.side]: msg.offset,
            top: msg.top,
            textAlign: msg.side === 'left' ? 'left' : 'right',
          }}
        >
          {msg.text}
        </Box>
      ))}
    </Box>
  );
}
