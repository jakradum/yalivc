"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/breadcrumb.module.css'

// Segments that don't have their own page - link to parent instead
const SKIP_SEGMENTS = ['companies'];

const Breadcrumb = ({ customLabel }) => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          
          // If segment should be skipped and it's not the last, link to parent
          let href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          if (SKIP_SEGMENTS.includes(segment) && !isLast) {
            href = `/${pathSegments.slice(0, index).join('/')}` || '/';
          }
          
          const title = isLast && customLabel 
            ? customLabel 
            : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
          
          return (
            <li key={href}>
              <span className={styles.separator}> &gt; </span>
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