import styles from '../../about-yali/about-styles.module.css';
import newsStyles from '../../newsroom/newscomponent.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getAllBlogPosts } from '@/lib/sanity-queries';
import Link from 'next/link';

const CONTENT_TYPE_LABELS = {
  'blog': 'Blog Post',
  'press-release': 'Press Release',
  'resource': 'Resource',
};

export const revalidate = 60;

export const metadata = {
  title: 'Blog | Yali Capital',
  description:
    "Insights, perspectives, and stories from the Yali Capital team on deep tech, venture capital, and India's innovation ecosystem.",
  alternates: {
    canonical: 'https://yali.vc/insights/blog/',
  },
};

export default async function BlogListing() {
  const { posts = [] } = await getAllBlogPosts({ limit: 50 });

  return (
    <section className={styles.sectionLevel}>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Blog</h1>
          <div className={styles.paraFlex}>
            <p>
              Perspectives from the Yali Capital team on deep tech, venture building, and the ideas
              shaping India&apos;s innovation economy.
            </p>
          </div>
        </article>
      </div>

      <section>
        <div className={styles.people}>
          <HeaderFlex title="All posts" color="black" desktopMaxWidth={'30%'} mobileMinHeight={'6rem'} />
        </div>

        {posts.length === 0 ? (
          <p style={{ padding: '2rem' }}>No posts published yet.</p>
        ) : (
          <div className={newsStyles.newsArticles}>
            {posts.map((post) => {
              const date = new Date(post.publishedAt);
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.toLocaleString('default', { month: 'short' });
              const year = date.getFullYear();

              return (
                <article key={post._id} className={newsStyles.article}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <p className={newsStyles.articleDate}>{`${day} ${month} ${year}`}</p>
                    {post.contentType && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#830D35', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
                      </span>
                    )}
                  </div>
                  <Link href={`/insights/blog/${post.slug.current}`}>
                    <p className={newsStyles.articleTitle}>{post.title}</p>
                  </Link>
                  {post.author && (
                    <p className={newsStyles.articleMeta}>{post.author.name}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
