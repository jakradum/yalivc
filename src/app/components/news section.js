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

const extractPseudoTitle = (url) => {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split('/').filter((segment) => segment.length > 0);

    const ignoredWords = ['articleshow', 'article', 'story', 'news', 'cms', 'html', 'php'];
    const relevantSegments = segments.filter(
      (segment) => !ignoredWords.some((word) => segment.toLowerCase().includes(word)) && !/^\d+$/.test(segment)
    );

    if (relevantSegments.length === 0) {
      return 'Article Title';
    }

    const rawTitle = relevantSegments[relevantSegments.length - 1];

    const words = rawTitle
      .split(/[-_]/)
      .map((word) => word.replace(/[^\w\s]/g, '').trim())
      .filter((word) => word.length > 0);

    return words
      .map((word) => {
        if (word.length <= 2) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  } catch (error) {
    return 'Article Title';
  }
};

const formatArticles = (articles) => {
  return articles.map((article) => ({
    ...article,
    formattedDate: formatDate(article.date),
    isVideo: isVideoUrl(article.url),
    title: article.headlineEdited || extractPseudoTitle(article.url),
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

  return (
    <div className={styles.newsSection}>
      <div className={styles.newsArticles}>
        {articles.map((article, index) => (
          <article key={index} className={styles.article}>
            <h3> {article.formattedDate && article.formattedDate}</h3>
            <h2 className={styles.articleTitle}>{truncateText(article.title, 50)}</h2>
            <p className={styles.articleMeta}>
              {article.publicationName}
              
            </p>
            {isClient && (
              <p className={styles.articleLink}>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.isVideo ? 'Watch' : 'Read more'}
                </a>
              </p>
            )}
          </article>
        ))}
      </div>
      <Button href="/newsroom" color="black">
        Read all
      </Button>
    </div>
  );
};