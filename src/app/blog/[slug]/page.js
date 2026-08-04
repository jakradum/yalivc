import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '../../components/JsonLd';
import { XIcon } from '@/app/components/icons/small-icons/x-icon';
import { LinkedInIcon } from '@/app/components/icons/small-icons/linkedin-icon';
import { WhatsAppIcon } from '@/app/components/icons/small-icons/whatsapp-icon';
import { EmailIcon } from '@/app/components/icons/small-icons/email-icon';
import styles from './page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
  const { posts = [] } = await getAllBlogPosts({ limit: 100 });
  return posts.map((post) => ({ slug: post.slug.current }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Post Not Found | Yali Capital' };
  return {
    title: post.metaTitle || `${post.title} | Yali Capital`,
    description: post.metaDescription || (post.blurb ? `${post.blurb.substring(0, 155)}...` : undefined),
    alternates: { canonical: `https://yali.vc/blog/${slug}/` },
    openGraph: {
      title: post.metaTitle || `${post.title} | Yali Capital`,
      description: post.metaDescription || (post.blurb ? `${post.blurb.substring(0, 155)}...` : undefined),
      url: `https://yali.vc/blog/${slug}/`,
      type: 'article',
      ...(post.publishedAt && { publishedTime: post.publishedAt }),
      ...(post.ogImage?.asset?.url && { images: [{ url: post.ogImage.asset.url, alt: post.title }] }),
    },
  };
}

function formatDate(str) {
  if (!str) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(str));
}

function readingTime(body = []) {
  let words = 0;
  for (const block of body) {
    if (block._type === 'block' && Array.isArray(block.children)) {
      words += block.children.map(c => c.text || '').join(' ').trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(words / 200));
}

const portableComponents = {
  types: {
    image: ({ value }) => (
      <figure className={styles.ptImage}>
        <Image
          src={urlFor(value).width(640).url()}
          alt={value.alt || value.caption || ''}
          width={640}
          height={400}
          className={styles.ptImageEl}
        />
        {value.caption && <figcaption className={styles.ptCaption}>{value.caption}</figcaption>}
      </figure>
    ),
    pullQuote: ({ value }) => (
      <blockquote className={styles.ptPullQuote}>
        <p>{value.text}</p>
        {value.attribution && <cite className={styles.ptCite}>— {value.attribution}</cite>}
      </blockquote>
    ),
  },
  block: {
    normal: ({ children }) => <p className={styles.ptBody}>{children}</p>,
    h2: ({ children }) => <h2 className={styles.ptH2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.ptH3}>{children}</h3>,
    blockquote: ({ children }) => <blockquote className={styles.ptBlockQuote}><p>{children}</p></blockquote>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value.href} target={value.blank ? '_blank' : undefined} rel={value.blank ? 'noopener noreferrer' : undefined} className={styles.ptLink}>
        {children}
      </a>
    ),
    code: ({ children }) => <code className={styles.ptCode}>{children}</code>,
  },
};

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const mins = readingTime(post.body || []);
  const pageUrl = `https://yali.vc/blog/${slug}/`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(post.title);

  const typeLabel = post.contentType === 'press-release' ? 'Press Release'
    : post.contentType === 'resource' ? 'Resource'
    : 'Blog';

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.metaDescription || post.blurb,
        url: pageUrl,
        ...(post.publishedAt && { datePublished: post.publishedAt }),
        ...(post.ogImage?.asset?.url && { image: post.ogImage.asset.url }),
        author: { '@type': 'Organization', name: 'Yali Capital', url: 'https://yali.vc' },
        publisher: { '@type': 'Organization', name: 'Yali Capital', url: 'https://yali.vc', logo: { '@type': 'ImageObject', url: 'https://yali.vc/yali-logo.png' } },
      }} />

      <div className={styles.page}>
        <div className={styles.column}>

          {/* Title block */}
          <div className={styles.titleBlock}>
            <p className={styles.editionLabel}>
              {typeLabel} · {formatDate(post.publishedAt)} · {mins} min read
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            {post.author?.name && (
              <div className={styles.authorRow}>
                {post.author.photo && (
                  <img src={post.author.photo} alt={post.author.name} className={styles.authorPhoto} />
                )}
                <div className={styles.authorMeta}>
                  <span className={styles.authorName}>{post.author.name}</span>
                  {post.author.role && <span className={styles.authorRole}>{post.author.role}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Featured image */}
          {post.featuredImage?.asset?.url && (
            <figure className={styles.coverFigure}>
              <img
                src={post.featuredImage.asset.url}
                alt={post.featuredImage.alt || post.title}
                className={styles.coverImg}
              />
            </figure>
          )}

          {/* Body */}
          <div className={styles.body}>
            {post.body && <PortableText value={post.body} components={portableComponents} />}
          </div>

          {post.contentType === 'press-release' && (
            <p className={styles.pressNote}>
              Questions about this press release? <a href="/contact" className={styles.ptLink}>Contact us</a>
            </p>
          )}

          {/* Share */}
          <div className={styles.spreadBlock}>
            <p className={styles.spreadLabel}>Share</p>
            <div className={styles.shareIcons}>
              <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on X"><XIcon size={20} color="#830d35" /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on LinkedIn"><LinkedInIcon size={20} color="#830d35" /></a>
              <a href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={styles.shareIcon} aria-label="Share on WhatsApp"><WhatsAppIcon size={20} color="#830d35" /></a>
              <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className={styles.shareIcon} aria-label="Share via Email"><EmailIcon size={20} color="#830d35" /></a>
            </div>
          </div>

          {/* Footer */}
          <footer className={styles.footerStrip}>
            <span className={styles.footerLeft}>Yali Capital · Deep Tech Fund</span>
            <Link href="/blog" className={styles.footerRight}>All posts ↗</Link>
          </footer>

        </div>
      </div>
    </>
  );
}
