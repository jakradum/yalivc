"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/breadcrumb.module.css'

const Breadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
          
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