import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../../about-yali/about-styles.module.css';
import companyStyles from '../../investments/[slug]/[companySlug]/company.module.css';
import teamLPstyles from '../../landing page styles/team.module.css';
import ShareButtons from './ShareButtons';

const CONTENT_TYPE_LABELS = {
  'blog': 'Blog Post',
  'press-release': 'Press Release',
  'resource': 'Resource',
};

export const revalidate = 60;

export async function generateStaticParams() {
  const { posts = [] } = await getAllBlogPosts({ limit: 100 });
  return posts.map((post) => ({ slug: post.slug.current }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found | Yali Capital' };
  }

  return {
    title: post.metaTitle || `${post.title} | Yali Capital`,
    description:
      post.metaDescription ||
      (post.blurb ? `${post.blurb.substring(0, 155)}...` : undefined),
    alternates: {
      canonical: `https://yali.vc/blog/${slug}/`,
    },
    ...(post.ogImage?.asset?.url && {
      openGraph: {
        images: [{ url: post.ogImage.asset.url }],
      },
    }),
  };
}

const bodyComponents = {
  types: {
    image: ({ value }) => (
      <figure className={companyStyles.storyImage}>
        <Image
          src={urlFor(value).width(800).url()}
          alt={value.alt || ''}
          width={800}
          height={600}
          style={{ width: '100%', height: 'auto' }}
        />
        {value.caption && <figcaption>{value.caption}</figcaption>}
      </figure>
    ),
    pullQuote: ({ value }) => (
      <blockquote className={companyStyles.pullQuote}>
        <p>{value.text}</p>
        {value.attribution && <cite>— {value.attribution}</cite>}
      </blockquote>
    ),
  },
};

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const displayCategories = post.contentType === 'press-release'
    ? (post.companies || []).map((c) => c.category).filter(Boolean)
    : (post.categories || []);

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <section>
      {/* Breadcrumb */}
      <div style={{ padding: '2.5rem 2rem 1rem', fontSize: '0.875rem', color: '#666' }}>
        <Link href="/blog" style={{ color: '#830D35', textDecoration: 'none' }}>
          ← Blog
        </Link>
      </div>

      <article className={companyStyles.blogArticle} style={{ marginTop: '1rem', maxWidth: '75%' }}>
        <header className={companyStyles.articleHeader}>
          {(post.contentType || displayCategories.length > 0) && (
            <div className={companyStyles.articleTagsRow}>
              {post.contentType && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#fff',
                    backgroundColor: '#830D35',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.6rem',
                  }}
                >
                  {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
                </span>
              )}
              {displayCategories.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {displayCategories.map((cat) => (
                    <span
                      key={cat._id}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: '#830D35',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 className={companyStyles.articleTitle}>{post.title}</h1>

          <div className={companyStyles.articleMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {post.author && (
              <div className={companyStyles.authorInfo}>
                {post.author.photo && (
                  <Image
                    src={post.author.photo}
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className={companyStyles.authorPhoto}
                  />
                )}
                <div>
                  <p className={companyStyles.authorName}>{post.author.name}</p>
                </div>
              </div>
            )}
            {publishedDate && (
              <p className={companyStyles.articleDate}>{publishedDate}</p>
            )}
          </div>
          <ShareButtons url={`https://yali.vc/blog/${slug}/`} title={post.title} />
        </header>

        <div className={companyStyles.articleBody} style={{ overflow: 'hidden' }}>
          {post.featuredImage?.asset?.url && (
            <figure className={companyStyles.featuredImageFigure}>
              <Image
                src={post.featuredImage.asset.url}
                alt={post.featuredImage.alt || post.title}
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              {post.featuredImage.alt && (
                <figcaption style={{ fontSize: '0.8rem', color: '#888', padding: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                  {post.featuredImage.alt}
                </figcaption>
              )}
            </figure>
          )}
          {post.body && <PortableText value={post.body} components={bodyComponents} />}
        </div>

        {post.contentType === 'press-release' && (
          <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '2rem', marginBottom: 0 }}>
            Have questions about this press release?{' '}
            <a href="mailto:press@yali.vc" style={{ color: '#830D35' }}>Write to press@yali.vc</a>
          </p>
        )}

        {post.author?.linkedIn && (
          <div className={companyStyles.authorCard}>
            {post.author.photo && (
              <Image
                src={post.author.photo}
                alt={post.author.name}
                width={48}
                height={48}
                className={companyStyles.authorPhoto}
              />
            )}
            <div>
              <p className={companyStyles.authorName}>{post.author.name}</p>
            </div>
            <a
              href={post.author.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: 'auto' }}
            >
              <button className={teamLPstyles.socialButton}>in</button>
            </a>
          </div>
        )}
      </article>

      {/* Back link */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.875rem' }}>
        <Link href="/blog" style={{ color: '#830D35', textDecoration: 'none' }}>
          ← Back to Blog
        </Link>
      </div>
    </section>
  );
}
