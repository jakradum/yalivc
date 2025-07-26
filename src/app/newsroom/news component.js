'use client';
import React, { useState, useMemo } from 'react';
import styles from './newscomponent.module.css';
import Button from '../components/button';
import { useData } from '../data/fetch component';
import fallbackData from '../data/news.json';

const buttonText = 'view all coverage';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const formatArticles = (articles) => {
  return articles.map((article) => ({
    ...article,
    formattedDate: formatDate(article.date),
    title: article.headlineEdited,
    year: new Date(article.date).getFullYear(),
    month: new Date(article.date).getMonth(),
    monthName: new Date(article.date).toLocaleString('default', { month: 'long' })
  }));
};

export const NewsComponent = () => {
  const { data } = useData();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const articles = formatArticles(
    (data && data.status === 'success' && data.data && data.data.articles) 
      ? data.data.articles 
      : fallbackData.data.articles
  );

  // Get unique years and months for filter options
  const filterOptions = useMemo(() => {
    const years = [...new Set(articles.map(article => article.year))].sort((a, b) => b - a);
    const months = [
      { value: 0, name: 'January' },
      { value: 1, name: 'February' },
      { value: 2, name: 'March' },
      { value: 3, name: 'April' },
      { value: 4, name: 'May' },
      { value: 5, name: 'June' },
      { value: 6, name: 'July' },
      { value: 7, name: 'August' },
      { value: 8, name: 'September' },
      { value: 9, name: 'October' },
      { value: 10, name: 'November' },
      { value: 11, name: 'December' }
    ];
    
    return { years, months };
  }, [articles]);

  // Filter articles based on selected year and month
  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(article => article.year === parseInt(selectedYear));
    }
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(article => article.month === parseInt(selectedMonth));
    }
    
    return filtered;
  }, [articles, selectedYear, selectedMonth]);

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    // Reset month when year changes to 'all'
    if (e.target.value === 'all') {
      setSelectedMonth('all');
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const clearFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  };

  const renderArticle = (article, index) => (
    <article key={index} className={styles.article}>
      <p className={styles.articleDate}>{article.formattedDate}</p>
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        <p className={styles.articleTitle}>{article.title}</p>
      </a>
      <p className={styles.articleMeta}>{article.publicationName}</p>
    </article>
  );

  return (
    <div className={styles.newsSection}>
      {/* Filter Controls */}
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="year-filter" className={styles.filterLabel}>
            Filter by Year:
          </label>
          <select 
            id="year-filter"
            value={selectedYear} 
            onChange={handleYearChange}
            className={styles.filterSelect}
          >
            <option value="all">All Years</option>
            {filterOptions.years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="month-filter" className={styles.filterLabel}>
            Filter by Month:
          </label>
          <select 
            id="month-filter"
            value={selectedMonth} 
            onChange={handleMonthChange}
            className={styles.filterSelect}
            disabled={selectedYear === 'all'}
          >
            <option value="all">All Months</option>
            {filterOptions.months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>
        </div>

        {(selectedYear !== 'all' || selectedMonth !== 'all') && (
          <button 
            onClick={clearFilters}
            className={styles.clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className={styles.resultsInfo}>
        <p className={styles.resultsCount}>
          Showing {filteredArticles.length} of {articles.length} articles
          {selectedYear !== 'all' && ` for ${selectedYear}`}
          {selectedMonth !== 'all' && ` in ${filterOptions.months.find(m => m.value === parseInt(selectedMonth))?.name}`}
        </p>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className={styles.newsArticles}>
          {filteredArticles.map(renderArticle)}
        </div>
      ) : (
        <div className={styles.noResults}>
          <p>No articles found for the selected filters.</p>
          <button onClick={clearFilters} className={styles.clearFilters}>
            Show All Articles
          </button>
        </div>
      )}
    </div>
  );
};