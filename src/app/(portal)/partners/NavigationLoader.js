'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './partners.module.css';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // When pathname or searchParams change, navigation is complete
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Intercept clicks on internal links to show spinner
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Only trigger for internal portal navigations (not external links, not mailto, not same-page anchors)
      const isExternal = link.target === '_blank' || link.rel?.includes('noopener');
      const isMailto = href.startsWith('mailto:');
      const isSamePage = href.startsWith('#');

      if (isExternal || isMailto || isSamePage) return;

      // Show loader for internal navigations
      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        setLoading(true);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!loading) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner} />
    </div>
  );
}
