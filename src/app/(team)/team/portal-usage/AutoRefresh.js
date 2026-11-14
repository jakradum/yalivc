'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-reads the page from Supabase every 30 minutes. A hidden tab skips the
// refresh and catches up when it is shown again, so an idle tab costs nothing.
const EVERY = 30 * 60 * 1000;

export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.hidden || Date.now() - last < EVERY) return;
      last = Date.now();
      router.refresh();
    };
    const id = setInterval(tick, 60 * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router]);
  return null;
}
