'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './BlogFilters.module.css';

export default function BlogFilters({ authors, categories, companies, currentAuthor, currentCategory, currentCompany }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    
    params.delete('page');
    
    router.push(`/insights/blog?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/insights/blog');
  };

  const hasActiveFilters = currentAuthor || currentCategory || currentCompany;

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
        <label htmlFor="category">Category:</label>
        <select 
          id="category"
          value={currentCategory || ''} 
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>{category.name}</option>
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