'use client';

import { useEffect } from 'react';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.overscrollBehavior = '';
    };
  }, []);

  return <>{children}</>;
}
