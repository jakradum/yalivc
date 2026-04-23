'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Lottie from 'lottie-react';
import animationData from '@/yali-loader.json';

const MIN_DISPLAY_MS = 600;

export default function DataroomNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const elapsed = Date.now() - (shownAtRef.current || Date.now());
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
    hideTimerRef.current = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(hideTimerRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      const isExternal = link.target === '_blank' || link.rel?.includes('noopener');
      if (isExternal || href.startsWith('mailto:') || href.startsWith('#')) return;

      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        shownAtRef.current = Date.now();
        setVisible(true);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(239, 239, 239, 0.85)',
      backdropFilter: 'blur(2px)',
    }}>
      <Lottie animationData={animationData} loop style={{ width: 120, height: 120 }} />
    </div>
  );
}
