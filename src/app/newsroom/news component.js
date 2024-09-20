'use client';
import React from 'react';
import styles from './newscomponent.module.css'
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
  }));
};

export const NewsComponent = () => {
  const { data } = useData();

  const articles = formatArticles(
    (data && data.status === 'success' && data.data && data.data.articles) 
      ? data.data.articles 
      : fallbackData.data.articles
  );

  const renderArticle = (article, index) => (
    <article className={styles.article}>
      <p className={styles.articleDate}>{article.formattedDate}</p>
      <a key={index} href={article.url}>
        <p className={styles.articleTitle}>{article.title}</p>
      </a>

      <p className={styles.articleMeta}>{article.publicationName}</p>
    </article>
  );

  return (
    <div className={styles.newsSection}>
      <div className={styles.newsArticles}>
        {articles.map(renderArticle)}
      </div>
    </div>
  );
};