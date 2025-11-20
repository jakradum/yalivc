import styles from '../../../about-yali/about-styles.module.css';
import blogStyles from './blog.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { portableTextComponents } from '@/app/components/portable-text/PortableTextComponents';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Link from 'next/link';
import ShareButtons from './sharebuttons';
import { calculateReadingTime } from '@/lib/readingtime';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found | YALI Capital',
    };
  }


  return {
    title: post.metaTitle || `${post.title} | YALI Capital Blog`,
    description: post.metaDescription || post.blurb || `Read ${post.title} by ${post.author?.name} on YALI Capital's blog`,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.blurb,
      images: post.ogImage?.asset?.url || post.featuredImage?.asset?.url ? [
        {
          url: post.ogImage?.asset?.url || post.featuredImage?.asset?.url,
          alt: post.featuredImage?.alt || post.title
        }
      ] : undefined,
    }
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  
  
  try {
    const post = await getBlogPostBySlug(slug);

    if (!post) {
      notFound();
    }
    const readingTime = calculateReadingTime(post.body);

    // Get related posts
    const relatedPosts = await getRelatedBlogPosts(
      post._id, 
      post.sectors, 
      post.companies, 
      3
    );

    // Format date
    const publishDate = new Date(post.publishedAt);
    const formattedDate = publishDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return (
      <section className={styles.sectionLevel}>
        <Breadcrumb />

        {/* Article Header */}

        <article className={blogStyles.blogArticle}>
          <div className={blogStyles.postMeta}>
            {post.sectors?.length > 0 && <span className={blogStyles.metaTag}>{post.sectors[0].name}</span>}
            <span className={blogStyles.metaTag}>
              {post.contentType === 'newsletter' ? 'Newsletter' : post.contentType === 'resource' ? 'Resource' : 'Blog'}
            </span>
          </div>
          <header className={blogStyles.articleHeader}>
            <h1 className={blogStyles.articleTitle}>{post.title}</h1>

            {post.blurb && <p className={blogStyles.articleBlurb}>{post.blurb}</p>}

            {/* Author & Meta */}
            <div className={blogStyles.articleMeta}>
              {post.author && (
                <div className={blogStyles.authorInfo}>
                  {post.author.photo && (
                    <Image
                      src={post.author.photo}
                      alt={post.author.name}
                      width={48}
                      height={48}
                      className={blogStyles.authorPhoto}
                    />
                  )}
                  <div>
                    <p className={blogStyles.authorName}>{post.author.name}</p>
                    <p className={blogStyles.authorRole}>{post.author.role} @ Yali</p>
                  </div>
                </div>
              )}
              <div className={blogStyles.dateAndTime}>
                <time dateTime={post.publishedAt}>{formattedDate}</time>
                <span className={blogStyles.separator}> | </span>
                <span>{readingTime} min read</span>
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage?.asset?.url && (
              <div className={blogStyles.featuredImage}>
                <Image
                  src={post.featuredImage.asset.url}
                  alt={post.featuredImage.alt || post.title}
                  width={1200}
                  height={600}
                  priority
                  className={blogStyles.featuredImg}
                />
              </div>
            )}
          </header>

          {/* Article Body */}
          <div className={blogStyles.articleBody}>
            <PortableText value={post.body} components={portableTextComponents} />
          </div>

          <ShareButtons
            url={`https://yali.vc/insights/blog/${post.slug.current}`}
            title={post.title}
            description={post.blurb || ''}
          />

          {/* Tags Section */}
          {(post.sectors?.length > 0 || post.companies?.length > 0) && (
            <footer className={blogStyles.articleFooter}>
              <p>Explore more</p>
              <div className={blogStyles.tagsSection}>
                {post.sectors?.length > 0 && (
                  <div className={blogStyles.tagGroup}>
                    <span className={blogStyles.tagLabel}>Sectors:</span>
                    <div className={blogStyles.tags}>
                      {post.sectors.map((sector) => (
                        <Link
                          key={sector._id}
                          href={`/investments/sectors/${sector.slug.current}`}
                          className={blogStyles.tag}
                        >
                          {sector.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {post.companies?.length > 0 && (
                  <div className={blogStyles.tagGroup}>
                    <span className={blogStyles.tagLabel}>Companies:</span>
                    <div className={blogStyles.tags}>
                      {post.companies.map((company) => (
                        <Link
                          key={company._id}
                          href={`/investments/companies/${company.slug.current}`}
                          className={blogStyles.tag}
                        >
                          {company.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Author Bio */}
              {post.author && (
                <section>
                  <div className={blogStyles.writtenBy}>
                    <p>Written by</p>
                    <div className={blogStyles.authorBio}>
                      {post.author.photo && (
                        <Image
                          src={post.author.photo}
                          alt={post.author.name}
                          width={80}
                          height={80}
                          className={blogStyles.authorBioPhoto}
                        />
                      )}
                      <div className={blogStyles.authorBioContent}>
                        <h3 className={blogStyles.authorBioName}>{post.author.name}</h3>
                        {post.author.oneLiner && <p className={blogStyles.authorBioOneLiner}>{post.author.oneLiner}</p>}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </footer>
          )}
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className={blogStyles.relatedSection}>
            <HeaderFlex title="Related articles" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
            <div className={blogStyles.relatedGrid}>
              {relatedPosts.map((relatedPost) => {
                const relatedDate = new Date(relatedPost.publishedAt);
                const relatedFormattedDate = relatedDate.toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <Link
                    key={relatedPost._id}
                    href={`/insights/blog/${relatedPost.slug.current}`}
                    className={blogStyles.relatedCard}
                  >
                    {relatedPost.featuredImage?.asset?.url && (
                      <div className={blogStyles.relatedImage}>
                        <Image
                          src={relatedPost.featuredImage.asset.url}
                          alt={relatedPost.featuredImage.alt || relatedPost.title}
                          width={400}
                          height={250}
                          className={blogStyles.relatedImg}
                        />
                      </div>
                    )}
                    <div className={blogStyles.relatedContent}>
                      <time className={blogStyles.relatedDate}>{relatedFormattedDate}</time>
                      <h3 className={blogStyles.relatedTitle}>{relatedPost.title}</h3>
                      {relatedPost.blurb && <p className={blogStyles.relatedBlurb}>{relatedPost.blurb}</p>}
                      {relatedPost.author && <p className={blogStyles.relatedAuthor}>By {relatedPost.author.name}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <Breadcrumb />
      </section>
    );
  } catch (error) {
    console.error('Error loading blog post:', error);
    notFound();
  }
}