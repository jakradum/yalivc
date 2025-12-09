import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { portableTextComponents } from '@/app/components/portable-text/PortableTextComponents';
import Button from '@/app/components/button';
import styles from './newsletter-sections.module.css';

// Opening Note Section
export function OpeningNote({ sectionTitle, author, body }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{sectionTitle || 'Opening Note'}</h2>
      </div>
      <div className={styles.openingNote}>
        <div className={styles.richText}>
          <PortableText value={body} components={portableTextComponents} />
        </div>
        {author && (
          <div className={styles.author}>
            <Link href={`/about-yali/${author.slug}`} className={styles.authorLink}>
              {author.photo && (
                <Image
                  src={author.photo}
                  alt={author.name}
                  width={48}
                  height={48}
                  className={styles.authorPhoto}
                />
              )}
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{author.name}</span>
                {author.role && <span className={styles.authorRole}>{author.role}</span>}
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Essay Section
export function Essay({ title, body, author }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.essay}>
        <div className={styles.richText}>
          <PortableText value={body} components={portableTextComponents} />
        </div>
        {author && (
          <div className={styles.author}>
            <Link href={`/about-yali/${author.slug}`} className={styles.authorLink}>
              {author.photo && (
                <Image
                  src={author.photo}
                  alt={author.name}
                  width={48}
                  height={48}
                  className={styles.authorPhoto}
                />
              )}
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{author.name}</span>
                {author.role && <span className={styles.authorRole}>{author.role}</span>}
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Portfolio Spotlight Section
export function PortfolioSpotlight({ sectionTitle, company, body }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{sectionTitle || 'Portfolio Spotlight'}</h2>
      </div>
      <div className={styles.portfolioSpotlight}>
        {company && (
          <div className={styles.companyHeader}>
            {company.logo && (
              <Image
                src={company.logo}
                alt={company.name}
                width={120}
                height={60}
                className={styles.companyLogo}
              />
            )}
            <div className={styles.companyInfo}>
              <h3 className={styles.companyName}>{company.name}</h3>
              {company.oneLiner && <p className={styles.companyOneLiner}>{company.oneLiner}</p>}
              {company.link && (
                <a href={company.link} target="_blank" rel="noopener noreferrer" className={styles.companyLink}>
                  Visit website &rarr;
                </a>
              )}
            </div>
          </div>
        )}
        <div className={styles.richText}>
          <PortableText value={body} components={portableTextComponents} />
        </div>
      </div>
    </section>
  );
}

// Guest Column Section
export function GuestColumn({ sectionTitle, guestName, guestTitle, guestCompany, guestPhoto, body }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{sectionTitle || 'Guest Column'}</h2>
      </div>
      <div className={styles.guestColumn}>
        <div className={styles.guestHeader}>
          {guestPhoto?.asset?.url && (
            <Image
              src={guestPhoto.asset.url}
              alt={guestName}
              width={80}
              height={80}
              className={styles.guestPhoto}
            />
          )}
          <div className={styles.guestInfo}>
            <span className={styles.guestName}>{guestName}</span>
            <span className={styles.guestTitle}>
              {guestTitle}
              {guestCompany && ` at ${guestCompany}`}
            </span>
          </div>
        </div>
        <div className={styles.richText}>
          <PortableText value={body} components={portableTextComponents} />
        </div>
      </div>
    </section>
  );
}

// Radar Section
export function Radar({ sectionTitle, items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{sectionTitle || 'The Radar'}</h2>
        <p className={styles.sectionSubtitle}>What we&apos;re tracking this month</p>
      </div>
      <div className={styles.radar}>
        <ul className={styles.radarList}>
          {items.map((item, index) => (
            <li key={index} className={styles.radarItem}>
              <div className={styles.radarContent}>
                <h3 className={styles.radarTech}>{item.technology}</h3>
                <p className={styles.radarOneLiner}>{item.oneLiner}</p>
              </div>
              {item.contributor && (
                <Link href={`/about-yali/${item.contributor.slug}`} className={styles.radarContributor}>
                  {item.contributor.photo ? (
                    <Image
                      src={item.contributor.photo}
                      alt={item.contributor.name}
                      width={32}
                      height={32}
                      className={styles.contributorPhoto}
                    />
                  ) : (
                    <span className={styles.contributorInitials}>
                      {item.contributor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                  <span className={styles.contributorName}>{item.contributor.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Reading Section
export function Reading({ sectionTitle, items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{sectionTitle || "What We're Reading"}</h2>
      </div>
      <div className={styles.reading}>
        <ul className={styles.readingList}>
          {items.map((item, index) => (
            <li key={index} className={styles.readingItem}>
              <div className={styles.readingCard}>
                <span className={styles.readingTitle}>{item.title}</span>
                {item.blurb && <p className={styles.readingBlurb}>{item.blurb}</p>}
                <div className={styles.readingButtonWrapper}>
                  <Button href={item.url} color="black" target="_blank">
                    Buy this book
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Freeform Section
export function Freeform({ title, body }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.freeform}>
        <div className={styles.richText}>
          <PortableText value={body} components={portableTextComponents} />
        </div>
      </div>
    </section>
  );
}

// Section Renderer - Maps section types to components
export function NewsletterSection({ section }) {
  switch (section._type) {
    case 'openingNote':
      return <OpeningNote key={section._key} {...section} />;
    case 'essay':
      return <Essay key={section._key} {...section} />;
    case 'portfolioSpotlight':
      return <PortfolioSpotlight key={section._key} {...section} />;
    case 'guestColumn':
      return <GuestColumn key={section._key} {...section} />;
    case 'radar':
      return <Radar key={section._key} {...section} />;
    case 'reading':
      return <Reading key={section._key} {...section} />;
    case 'freeform':
      return <Freeform key={section._key} {...section} />;
    default:
      console.warn(`Unknown section type: ${section._type}`);
      return null;
  }
}
