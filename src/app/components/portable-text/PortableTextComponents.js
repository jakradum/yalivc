import Image from 'next/image';
import Link from 'next/link';
import styles from './PortableText.module.css';

export const portableTextComponents = {
  types: {
    image: ({ value }) => {
      console.log('Image value received:', JSON.stringify(value, null, 2));

      // Try multiple possible paths
      const imageUrl =
        value?.asset?.url ||
        value?.url ||
        (value?.asset?._ref
          ? `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${value.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`
          : null);

      if (!imageUrl) {
        return <p>Image failed to load</p>;
      }

      return (
        <figure className={styles.imageBlock}>
          <Image src={imageUrl} alt={value.alt || ''} width={800} height={600} className={styles.image} />
          {value.caption && <figcaption className={styles.caption}>{value.caption}</figcaption>}
        </figure>
      );
    },
    pullQuote: ({ value }) => {
      return (
        <blockquote className={styles.pullQuote}>
          <p className={styles.pullQuoteText}>{value.text}</p>
          {value.attribution && <cite className={styles.pullQuoteAttribution}>— {value.attribution}</cite>}
        </blockquote>
      );
    },
    blockQuote: ({ value }) => {
      return (
        <blockquote className={styles.blockQuote}>
          <p className={styles.blockQuoteText}>{value.text}</p>
          {value.attribution && (
            <cite className={styles.blockQuoteAttribution}>
              — {value.attribution}
              {value.cite && (
                <>
                  {' '}
                  (
                  <a href={value.cite} target="_blank" rel="noopener noreferrer">
                    source
                  </a>
                  )
                </>
              )}
            </cite>
          )}
        </blockquote>
      );
    },
  },
  marks: {
    link: ({ value, children }) => {
      const target = value?.blank ? '_blank' : undefined;
      const rel = value?.blank ? 'noopener noreferrer' : undefined;
      return (
        <a href={value?.href} target={target} rel={rel}>
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code className={styles.inlineCode}>{children}</code>,
  },
  block: {
    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
    normal: ({ children }) => <p className={styles.paragraph}>{children}</p>,
    blockquote: ({ children }) => <blockquote className={styles.standardQuote}>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className={styles.bulletList}>{children}</ul>,
    number: ({ children }) => <ol className={styles.numberList}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className={styles.listItem}>{children}</li>,
    number: ({ children }) => <li className={styles.listItem}>{children}</li>,
  },
};
