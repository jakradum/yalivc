import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import { getNewsletterBySlug, getAllNewsletterSlugs } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { YoutubeIcon } from '@/app/components/icons/small-icons/youtube-icon';
import { SpotifyIcon } from '@/app/components/icons/small-icons/spotify-icon';
import { XIcon } from '@/app/components/icons/small-icons/x-icon';
import { LinkedInIcon } from '@/app/components/icons/small-icons/linkedin-icon';
import { WhatsAppIcon } from '@/app/components/icons/small-icons/whatsapp-icon';
import { EmailIcon } from '@/app/components/icons/small-icons/email-icon';
import styles from './page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllNewsletterSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);
  if (!newsletter) return { title: 'Not Found — Yali Capital' };
  return {
    title: `${newsletter.title} — Yali Capital`,
    description: newsletter.shortDescription,
    alternates: {
      canonical: `https://yali.vc/newsletter/${slug}/`,
    },
  };
}

function getPlatform(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  return 'other';
}

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getFirstName(fullName) {
  if (!fullName) return null;
  return fullName.split(' ')[0];
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/* ── PortableText component map ── */

const portableComponents = {
  types: {
    image: ({ value }) => (
      <figure className={styles.ptImage}>
        <Image
          src={urlFor(value).width(640).url()}
          alt={value.alt || ''}
          width={640}
          height={400}
          className={styles.ptImageEl}
        />
        {value.caption && (
          <figcaption className={styles.ptCaption}>{value.caption}</figcaption>
        )}
      </figure>
    ),
    pullQuote: ({ value }) => (
      <blockquote className={styles.ptPullQuote}>
        <p>{value.text}</p>
        {value.attribution && <cite className={styles.ptCite}>— {value.attribution}</cite>}
      </blockquote>
    ),
    blockQuote: ({ value }) => (
      <blockquote className={styles.ptBlockQuote}>
        <p>{value.text}</p>
        {value.attribution && <cite className={styles.ptCite}>— {value.attribution}</cite>}
      </blockquote>
    ),
  },
  block: {
    normal: ({ children }) => <p className={styles.ptBody}>{children}</p>,
    h2: ({ children }) => <h2 className={styles.ptH2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.ptH3}>{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className={styles.ptBlockQuote}>
        <p>{children}</p>
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value.href}
        target={value.blank ? '_blank' : undefined}
        rel={value.blank ? 'noopener noreferrer' : undefined}
        className={styles.ptLink}
      >
        {children}
      </a>
    ),
    code: ({ children }) => <code className={styles.ptCode}>{children}</code>,
  },
};

/* ── Section renderers ── */

function SectionLabel({ text }) {
  return <p className={styles.sectionLabel}>{text}</p>;
}

function OpeningNote({ section }) {
  return (
    <div className={styles.section}>
      {section.body && (
        <PortableText value={section.body} components={portableComponents} />
      )}
      {section.author && (
        <p className={styles.authorAttribution}>— {section.author.name}</p>
      )}
    </div>
  );
}

function Essay({ section }) {
  return (
    <div className={styles.section}>
      {section.title && <SectionLabel text={section.title} />}
      {section.body && (
        <PortableText value={section.body} components={portableComponents} />
      )}
      {section.author && (
        <p className={styles.authorAttribution}>— {section.author.name}</p>
      )}
    </div>
  );
}

function PortfolioSpotlight({ section }) {
  const label = section.company
    ? `PORTFOLIO · ${section.company.name}`
    : (section.sectionTitle || 'PORTFOLIO SPOTLIGHT');
  return (
    <div className={styles.section}>
      <SectionLabel text={label} />
      {section.body && (
        <PortableText value={section.body} components={portableComponents} />
      )}
    </div>
  );
}

function GuestColumn({ section }) {
  return (
    <div className={styles.section}>
      <SectionLabel text={section.sectionTitle || 'GUEST'} />
      {section.guestName && (
        <div className={styles.guestMeta}>
          <span className={styles.guestName}>{section.guestName}</span>
          {(section.guestTitle || section.guestCompany) && (
            <span className={styles.guestRole}>
              {[section.guestTitle, section.guestCompany].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      )}
      {section.body && (
        <PortableText value={section.body} components={portableComponents} />
      )}
    </div>
  );
}

function Freeform({ section }) {
  return (
    <div className={styles.section}>
      {section.title && <SectionLabel text={section.title} />}
      {section.body && (
        <PortableText value={section.body} components={portableComponents} />
      )}
    </div>
  );
}

function Radar({ section }) {
  const items = section.items || [];
  return (
    <div className={styles.section}>
      <SectionLabel text={section.sectionTitle || 'ON OUR RADAR'} />
      <div className={styles.radarList}>
        {items.map((item, i) => (
          <div key={i} className={styles.radarRow}>
            <span className={styles.radarTech}>{item.technology}</span>
            <span className={styles.radarOneLiner}>{item.oneLiner}</span>
            {item.contributor && (
              <span className={styles.radarContributor}>{item.contributor.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Reading({ section }) {
  const items = section.items || [];
  return (
    <div className={styles.section}>
      <SectionLabel text={section.sectionTitle || 'READING LIST'} />
      <div className={styles.readingList}>
        {items.map((item, i) => (
          <div key={i} className={styles.readingRow}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.readingTitle}
            >
              {item.title} ↗
            </a>
            {item.blurb && <p className={styles.readingBlurb}>{item.blurb}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSection(section) {
  switch (section._type) {
    case 'openingNote':
      return <OpeningNote key={section._key} section={section} />;
    case 'essay':
      return <Essay key={section._key} section={section} />;
    case 'portfolioSpotlight':
      return <PortfolioSpotlight key={section._key} section={section} />;
    case 'guestColumn':
      return <GuestColumn key={section._key} section={section} />;
    case 'freeform':
      return <Freeform key={section._key} section={section} />;
    case 'radar':
      return <Radar key={section._key} section={section} />;
    case 'reading':
      return <Reading key={section._key} section={section} />;
    default:
      return null;
  }
}

/* ── Page ── */

export default async function NewsletterEdition({ params }) {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);

  if (!newsletter) notFound();

  const pageUrl = `https://yali.vc/newsletter/${slug}/`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(newsletter.title);
  const shareSubject = encodeURIComponent(`${newsletter.title} — Yali Capital Newsletter`);
  const shareBody = encodeURIComponent(`Thought you'd find this interesting: ${pageUrl}`);

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.column}>
        <nav className={styles.breadcrumb}>
          <Link href="/newsletter" className={styles.breadcrumbLink}>Newsletter</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Issue {newsletter.edition}</span>
        </nav>
      </div>

      {/* Full-width masthead */}
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <p className={styles.mastheadDate}>{formatDate(newsletter.publishedDate)}</p>
          <h1 className={styles.mastheadTitle}>{newsletter.title}</h1>
          {newsletter.author?.name && (
            <p className={styles.mastheadByline}>
              By {getFirstName(newsletter.author.name)} · Yali Capital Podcast
            </p>
          )}
        </div>
      </header>

      <div className={styles.column}>

        {/* Sections */}
        <div className={styles.sections}>
          {(newsletter.sections || []).map(renderSection)}
        </div>

        {/* Episode player / CTA */}
        {newsletter.podcastUrl && (() => {
          const platform = getPlatform(newsletter.podcastUrl);
          if (platform === 'youtube') {
            const videoId = getYoutubeId(newsletter.podcastUrl);
            if (!videoId) return null;
            return (
              <div className={styles.youtubeBlock}>
                <div className={styles.youtubeWrap}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${newsletter.title} — Yali Capital Podcast Ep. ${newsletter.edition}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles.youtubeFrame}
                  />
                </div>
                <p className={styles.youtubeCaption}>
                  YALI CAPITAL PODCAST · EP.{newsletter.edition}
                </p>
              </div>
            );
          }
          return (
            <a
              href={newsletter.podcastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.episodeCta}
            >
              <div className={styles.episodeCtaLeft}>
                <span className={styles.episodeCtaLabel}>
                  YALI CAPITAL PODCAST · EP.{newsletter.edition}
                </span>
                <span className={styles.episodeCtaTitle}>{newsletter.title}</span>
              </div>
              <span className={styles.episodeCtaLink}>
                {platform === 'spotify' && <SpotifyIcon size={13} color="#1DB954" />}
                Listen ↗
              </span>
            </a>
          );
        })()}

        {/* Share */}
        <div className={styles.spreadBlock}>
          <p className={styles.spreadLabel}>Share this article</p>
          <div className={styles.shareIcons}>
            <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on X">
              <XIcon size={20} color="#830d35" />
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on LinkedIn">
              <LinkedInIcon size={20} color="#830d35" />
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on WhatsApp">
              <WhatsAppIcon size={20} color="#830d35" />
            </a>
            <a href={`mailto:?subject=${shareSubject}&body=${shareBody}`} className={styles.shareIcon} aria-label="Share via Email">
              <EmailIcon size={20} color="#830d35" />
            </a>
          </div>
        </div>

        {/* Footer strip */}
        <footer className={styles.footerStrip}>
          <span className={styles.footerLeft}>YALI CAPITAL · DEEP TECH FUND</span>
          <Link href="/newsletter" className={styles.footerRight}>All editions ↗</Link>
        </footer>

      </div>

    </div>
  );
}
