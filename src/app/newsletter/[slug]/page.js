import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getNewsletterBySlug, getAllNewsletterSlugs } from '@/lib/sanity-queries';
import { NewsletterSection } from '../NewsletterSections';
import ShareButtons from './ShareButtons';
import Breadcrumb from '../../components/breadcrumb';
import FooterSubscribe from '../../components/FooterSubscribe';
import styles from './newsletter-detail.module.css';

export const revalidate = 60;

// Generate static params for all newsletters
export async function generateStaticParams() {
  const slugs = await getAllNewsletterSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

// Generate metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);

  if (!newsletter) {
    return {
      title: 'Newsletter Not Found | Yali Capital',
    };
  }

  return {
    title: `${newsletter.title} | Tattva by Yali Capital`,
    description: newsletter.shortDescription,
    openGraph: {
      title: `${newsletter.title} | Tattva`,
      description: newsletter.shortDescription,
      type: 'article',
      publishedTime: newsletter.publishedDate,
      images: newsletter.coverImage?.asset?.url
        ? [{ url: newsletter.coverImage.asset.url }]
        : [],
    },
  };
}

export default async function NewsletterDetailPage({ params }) {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);

  if (!newsletter) {
    notFound();
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className={styles.main}>
      <Breadcrumb />
      <article className={styles.article}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.meta}>
              <span className={styles.edition}>Tattva #{newsletter.edition}</span>
              <span className={styles.separator}>&bull;</span>
              <time className={styles.date}>{formatDate(newsletter.publishedDate)}</time>
            </div>
            <h1 className={styles.title}>{newsletter.title}</h1>
            {newsletter.shortDescription && (
              <p className={styles.description}>{newsletter.shortDescription}</p>
            )}
          </div>
          {newsletter.coverImage?.asset?.url && (
            <div className={styles.coverImage}>
              <Image
                src={newsletter.coverImage.asset.url}
                alt={newsletter.coverImage.alt || newsletter.title}
                fill
                className={styles.coverImg}
                priority
              />
            </div>
          )}
        </header>

        {/* Sections */}
        <div className={styles.content}>
          {newsletter.sections?.map((section, index) => (
            <NewsletterSection key={section._key || index} section={section} />
          ))}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.shareSection}>
            <h3>Share this edition</h3>
            <ShareButtons title={newsletter.title} slug={newsletter.slug.current} />
          </div>

          <div className={styles.subscribeCta}>
            <h3>Enjoyed this edition?</h3>
            <p>Get Tattva delivered to your inbox every month.</p>
            <FooterSubscribe variant="light" showLabel={false} />
          </div>

        </footer>
      </article>
      <div className={styles.bottomBreadcrumb}>
        <Breadcrumb />
      </div>
      <div className={styles.footerLine}></div>
    </main>
  );
}
