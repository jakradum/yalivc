'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './BlogFilters.module.css';

export default function BlogFilters({ authors, sectors, companies, currentAuthor, currentSector, currentCompany }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    
    params.delete('page'); // Reset to page 1 on filter change
    
    router.push(`/insights/blog?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/insights/blog');
  };

  const hasActiveFilters = currentAuthor || currentSector || currentCompany;

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <label htmlFor="author">Author:</label>
        <select 
          id="author"
          value={currentAuthor || ''} 
          onChange={(e) => handleFilterChange('author', e.target.value)}
          className={styles.select}
        >
          <option value="">All Authors</option>
          {authors.map(author => (
            <option key={author._id} value={author._id}>{author.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="sector">Sector:</label>
        <select 
          id="sector"
          value={currentSector || ''} 
          onChange={(e) => handleFilterChange('sector', e.target.value)}
          className={styles.select}
        >
          <option value="">All Sectors</option>
          {sectors.map(sector => (
            <option key={sector._id} value={sector._id}>{sector.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="company">Company:</label>
        <select 
          id="company"
          value={currentCompany || ''} 
          onChange={(e) => handleFilterChange('company', e.target.value)}
          className={styles.select}
        >
          <option value="">All Companies</option>
          {companies.map(company => (
            <option key={company._id} value={company._id}>{company.name}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className={styles.clearButton}>
          Clear Filters
        </button>
      )}
    </div>
  );
}