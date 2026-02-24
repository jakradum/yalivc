import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../../../about-yali/about-styles.module.css';
import companyStyles from '../../../investments/[slug]/[companySlug]/company.module.css';
import teamLPstyles from '../../../landing page styles/team.module.css';

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
      canonical: `https://yali.vc/insights/blog/${slug}/`,
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
      <div style={{ padding: '1rem 2rem', fontSize: '0.875rem', color: '#666' }}>
        <Link href="/insights/blog" style={{ color: '#830D35', textDecoration: 'none' }}>
          ← Blog
        </Link>
      </div>

      <article className={companyStyles.blogArticle} style={{ marginTop: '1rem', maxWidth: '75%' }}>
        <header className={companyStyles.articleHeader}>
          {(post.contentType || post.categories?.length > 0) && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {post.categories?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  {post.categories.map((cat) => (
                    <span
                      key={cat._id}
                      style={{
                        fontSize: '0.75rem',
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
                    width={48}
                    height={48}
                    className={companyStyles.authorPhoto}
                  />
                )}
                <div>
                  <p className={companyStyles.authorName}>{post.author.name}</p>
                  {post.author.role && (
                    <p className={companyStyles.authorRole}>{post.author.role}</p>
                  )}
                </div>
              </div>
            )}
            {publishedDate && (
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0, marginLeft: 'auto' }}>{publishedDate}</p>
            )}
          </div>
        </header>

        <div className={companyStyles.articleBody} style={{ overflow: 'hidden' }}>
          {post.featuredImage?.asset?.url && (
            <figure style={{
              float: 'right',
              width: '38%',
              margin: '0 0 1.5rem 2rem',
              border: '1px solid #e0e0e0',
            }}>
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
              {post.author.oneLiner && (
                <p className={companyStyles.authorRole}>{post.author.oneLiner}</p>
              )}
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
        <Link href="/insights/blog" style={{ color: '#830D35', textDecoration: 'none' }}>
          ← Back to Blog
        </Link>
      </div>
    </section>
  );
}
