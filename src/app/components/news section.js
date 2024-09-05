'use client';
import React, { useState, useEffect } from 'react';
import styles from '../landing page styles/newssec.module.css';
import Button from './button';
import { useData } from '../data/fetch component';
import fallbackData from '../data/news.json';

const buttonText = 'view all coverage';

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, options);
};

const formatArticles = (articles) => {
  return articles.map((article) => ({
    ...article,
    formattedDate: formatDate(article.date),
    title: article.headlineEdited,
  }));
};

export const NewsSection = () => {
  const { data } = useData();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const articles = formatArticles(
    (data && data.status === 'success' && data.data && data.data.articles) 
      ? data.data.articles 
      : fallbackData.data.articles
  );

  const renderLeftGridArticle = (article, index) => (
    <article key={index} className={styles.article}>
      <h3>{article.formattedDate}</h3>
      <p className={styles.articleTitle}>{truncateText(article.title, 50)}</p>
      <p className={styles.articleMeta}>{article.publicationName || 'Unknown publication'}</p>
      {isClient && (
        <p className={styles.articleLink}>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.isVideo ? 'Watch' : 'Read more'}
          </a>
        </p>
      )}
    </article>
  );

  const renderButton = () => (
    <div className={`${styles.article} ${styles.readAllButton}`}>
      <Button href="/newsroom" color="black">
        {buttonText}
      </Button>
    </div>
  );

  const renderRightStackArticle = (article, index) => (
    <a key={index} href={article.url} target="_blank" rel="noopener noreferrer">
      <article className={styles.article}>
        <h3>{article.formattedDate}</h3>
        <p className={styles.articleTitle}>{truncateText(article.title, 50)}</p>
      </article>
    </a>
  );

  return (
    <div className={styles.newsSection}>
      <div className={styles.newsArticles}>
        <div className={styles.leftGrid}>
          {articles.slice(0, 4).map(renderLeftGridArticle)}
        </div>
        <div className={styles.rightStack}>
          {articles.slice(4, 8).map(renderRightStackArticle)}
          {renderButton()}
        </div>
      </div>
    </div>
  );
};