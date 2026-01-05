"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/breadcrumb.module.css'

const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  // Helper function to properly format segment titles
  const formatSegmentTitle = (segment) => {
    // Handle special cases
    if (segment === 'about-yali') {
      return 'About Yali';
    }

    // Default: capitalize each word
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const title = formatSegmentTitle(segment);

          return (
            <li key={href}>
              <span className={styles.separator}> · </span>
              {isLast ? (
                <span aria-current="page">{title}</span>
              ) : (
                <Link href={href}>{title}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;