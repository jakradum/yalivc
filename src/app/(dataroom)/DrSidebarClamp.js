'use client';

import { useEffect } from 'react';

// Shrinks the sidebar's bottom edge as the footer scrolls into view
// so sidebar items are never hidden behind the footer.
export default function DrSidebarClamp() {
  useEffect(() => {
    const sidebar = document.querySelector('[data-dr-sidebar]');
    const footer = document.querySelector('[data-dataroom] footer');
    if (!sidebar || !footer) return;

    function update() {
      const overlap = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
      sidebar.style.bottom = overlap + 'px';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return null;
}
