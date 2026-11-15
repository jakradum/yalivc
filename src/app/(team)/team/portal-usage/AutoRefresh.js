'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { refreshEvery } from './refreshSchedule';

// Re-reads the page from Supabase on the schedule in refreshSchedule.js: often just
// after an LP report comes out, then less and less. A hidden tab skips the refresh
// and catches up when it is shown again, so an idle tab costs nothing.
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.hidden || Date.now() - last < refreshEvery()) return;
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
