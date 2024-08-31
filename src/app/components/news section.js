'use client';

import React, { useState, useEffect } from "react";
import articlesData from '../data/news.json';

const extractPublicationName = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch (error) {
    return '';
  }
};

const extractPseudoTitle = (url) => {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    
    const ignoredWords = ['articleshow', 'article', 'story', 'news', 'cms', 'html', 'php'];
    const relevantSegments = segments.filter(segment => 
      !ignoredWords.some(word => segment.toLowerCase().includes(word)) && 
      !/^\d+$/.test(segment)
    );

    if (relevantSegments.length === 0) {
      return 'Article Title';
    }

    const rawTitle = relevantSegments[relevantSegments.length - 1];
    
    const words = rawTitle.split(/[-_]/).map(word => 
      word.replace(/[^\w\s]/g, '').trim()
    ).filter(word => word.length > 0);

    return words.map(word => {
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');

  } catch (error) {
    return 'Article Title';
  }
};

const extractDateFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const dateMatch = pathname.match(/\d{4}\/\d{2}\/\d{2}/);
    if (dateMatch) {
      return dateMatch[0].replace(/\//g, '-');
    }
    return null;
  } catch (error) {
    return null;
  }
};

const truncateText = (text, maxLength) => {
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
  const videoPatterns = [
    /youtube\.com/,
    /youtu\.be/,
    /vimeo\.com/,
    /\.(mp4|avi|mov|flv|wmv)$/i  // Common video file extensions
  ];
  return videoPatterns.some(pattern => pattern.test(url));
};

const getPublicationName = (article) => {
  if (article.publicationName) {
    return article.publicationName;
  }
  return extractPublicationName(article.url);
};

export const NewsSection = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchYouTubeTitle = async (url) => {
      try {
        const videoId = new URL(url).searchParams.get('v') || url.split('/').pop();
        if (!videoId) return null;

        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (!response.ok) return null;

        const data = await response.json();
        return data.title;
      } catch (error) {
        console.error('Error fetching YouTube title:', error);
        return null;
      }
    };

    const fetchAndFormatArticles = async () => {
      const formattedArticles = await Promise.all(
        articlesData.articles.map(async article => {
          let title = extractPseudoTitle(article.url);
          if (isVideoUrl(article.url)) {
            const youtubeTitle = await fetchYouTubeTitle(article.url);
            title = youtubeTitle || title;
          }

          return {
            ...article,
            formattedDate: formatDate(extractDateFromUrl(article.url) || article.date),
            publicationName: getPublicationName(article),
            title,
            isVideo: isVideoUrl(article.url),
          };
        })
      );
      setArticles(formattedArticles);
    };

    fetchAndFormatArticles();
  }, []);

  return (
    <div>
      {articles.map((article, index) => (
        <article key={index}>
          <h2>{truncateText(article.title, 50)}</h2>
          <p>
            {article.publicationName}
            {article.formattedDate && ` | ${article.formattedDate}`}
          </p>
          <p>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              {article.isVideo ? "Watch" : "Read more"}
            </a>
          </p>
        </article>
      ))}
    </div>
  );
};
