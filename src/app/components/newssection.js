'use client';
import React, { useState, useEffect } from 'react';
import styles from '../landing page styles/newssec.module.css';
import Button from './button';
import Link from 'next/link';
import fallbackData from '../data/news.json';


const buttonText = 'view all coverage';

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Consistent date formatting across server + client
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return formatter.format(date);
};

const formatArticles = (articles = []) => {
  return articles.map((article) => {
    const publicationFromQuery = article.publicationName ?? article.pubRefName;
    const publicationFromField =
      typeof article.publication === 'string' ? article.publication : undefined;
    const displayPublication = publicationFromQuery ?? publicationFromField ?? 'Unknown publication';

    return {
      ...article,
      formattedDate: formatDate(article.date),
      title: article.headlineEdited || article.title || 'Untitled',
      displayPublication,
    };
  });
};

export default function NewsSection({ news = [] }) {

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

const articles = formatArticles(news.length > 0 ? news : fallbackData.data.articles);

  const renderLeftGridArticle = (article, index) => (
    <article key={index} className={styles.article}>
      <h3>{article.formattedDate}</h3>
      <p className={styles.articleTitle}>{truncateText(article.title, 50)}</p>
      <p className={styles.articleMeta}>{article.displayPublication}</p>
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
      <Link style={{ textDecoration: 'none' }} href="/newsroom">
        <Button color="black">{buttonText}</Button>
      </Link>
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
        <div className={styles.leftGrid}>{articles.slice(0, 4).map(renderLeftGridArticle)}</div>
        <div className={styles.rightStack}>
          {articles.slice(4, 8).map(renderRightStackArticle)}
          {renderButton()}
        </div>
      </div>
    </div>
  );
}
