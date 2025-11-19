'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, totalPages, baseUrl }) {
  const searchParams = useSearchParams();

  const createPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const pages = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Show pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  }

  return (
    <div className={styles.pagination}>
      {currentPage > 1 && (
        <Link href={createPageUrl(currentPage - 1)} className={styles.arrow}>
          ← Previous
        </Link>
      )}

      <div className={styles.pages}>
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
          ) : (
            <Link
              key={page}
              href={createPageUrl(page)}
              className={`${styles.page} ${page === currentPage ? styles.active : ''}`}
            >
              {page}
            </Link>
          )
        ))}
      </div>

      {currentPage < totalPages && (
        <Link href={createPageUrl(currentPage + 1)} className={styles.arrow}>
          Next →
        </Link>
      )}
    </div>
  );
}