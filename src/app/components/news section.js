'use client';
import React, { useState, useEffect } from 'react';
import styles from '../landing page styles/newssec.module.css';
import Button from './button';
import articlesData from '../data/news.json';

const newsEndpoint =
  'https://script.googleusercontent.com/macros/echo?user_content_key=wMwqmD3hyEfjuyzrmit9jSDCLn5xdX1dHEGRoaIRU6my1Wo8PMkPxs98lDD7aWYsb4e6JeD_-mz3WDdMRgeUiCS1qgMJ1hhYm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnO7Olp7pqFy3TogCoZyFUbirTpo2gKpFMxR5S6ehinpBH3e6cC_4M7e1OIWPPuzQWGgZZi-ESOrh77Vl3ZGmdGSdJoCw8JvXDg&lib=MmHDKL-d2iWmU93zHCQ7t4_c2JwAnkCxa';

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

const isVideoUrl = (url) => {
  const videoPatterns = [/youtube\.com/, /youtu\.be/, /vimeo\.com/, /\.(mp4|avi|mov|flv|wmv)$/i];
  return videoPatterns.some((pattern) => pattern.test(url));
};

const formatArticles = (articles) => {
  return articles.map((article) => ({
    ...article,
    formattedDate: formatDate(article.date),
    isVideo: isVideoUrl(article.url),
    title: article.headlineEdited
  }));
};

export const NewsSection = () => {
  const [articles, setArticles] = useState(formatArticles(articlesData.data.articles));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchArticles = async () => {
      try {
        const response = await fetch(newsEndpoint);
        const data = await response.json();
        if (data.status === 'success' && data.data.articles) {
          const formattedArticles = formatArticles(data.data.articles);
          setArticles(formattedArticles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        // Fallback data will remain in use
      }
    };
    fetchArticles();
  }, []);

  const renderLeftGridArticle = (article, index) => (
    <article
      key={index}
      className={styles.article}
    >
      <h3>{article.formattedDate && article.formattedDate}</h3>
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
        Read all
      </Button>
    </div>
  );

  const renderRightStackArticle = (article, index) => (
    <a href={article.url} target='_blank'>
    <article key={index} className={styles.article}>
      <h3>{article.formattedDate && article.formattedDate}</h3>
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
