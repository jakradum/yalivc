import styles from './blog-listing.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getAllBlogPosts, getBlogAuthors, getBlogSectors, getBlogCompanies } from '@/lib/sanity-queries';
import Breadcrumb from '../../components/breadcrumb';
import Image from 'next/image';
import Link from 'next/link';
import BlogFilters from './BlogFilters';
import Pagination from './Pagination';
import aboutStyles from '../../about-yali/about-styles.module.css';
import { Gridsvg } from '@/app/components/icons/background svgs/gridsvg';

export const revalidate = 60;

export default async function BlogListingPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const authorId = params?.author || null;
  const sectorId = params?.sector || null;
  const companyId = params?.company || null;

  const limit = 12;
  const offset = (page - 1) * limit;

  const { posts, total } = await getAllBlogPosts({
    limit,
    offset,
    authorId,
    sectorId,
    companyId,
  });

  const [authors, sectors, companies] = await Promise.all([getBlogAuthors(), getBlogSectors(), getBlogCompanies()]);

  const totalPages = Math.ceil(total / limit);
  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = posts.filter((p) => p._id !== featuredPost?._id);

  return (
    <>
      <div className={aboutStyles.container}>
        <Breadcrumb />
        <section>
          <div className={aboutStyles.mainAbout}>
            <article className={aboutStyles.textContent}>
              <h1>Our Investments</h1>
              <div className={aboutStyles.paraFlex}>
                <p>
                  We focus our investing on Indian deep tech companies across sectors. We believe a deep tech company is
                  one whose moat is its cutting-edge technology that differentiates it from its competitors. And our
                  investments in the past have been in close alignment with this belief, with some of them even going
                  public, listing in Indian stock exchanges.
                </p>
                <p>
                  Our involvement with companies doesn't end with funding; we offer support and mentoring that helps
                  them go to market. Sectors that excite us most include semiconductor, robotics, smart manufacturing,
                  and genomics to name a few.
                </p>
              </div>
            </article>
            <aside className={aboutStyles.mainsecGraphic}>
              <Gridsvg />
            </aside>
          </div>
        </section>
        <div className={aboutStyles.sectorsSection}>
          <HeaderFlex title="In depth | The Yali Blog" color="black" desktopMaxWidth={'50%'} />
          <BlogFilters
            authors={authors}
            sectors={sectors}
            companies={companies}
            currentAuthor={authorId}
            currentSector={sectorId}
            currentCompany={companyId}
          />

          {/* Featured Post */}
          {featuredPost && page === 1 && (
            <Link href={`/insights/blog/${featuredPost.slug.current}`} className={styles.featuredPost}>
              {featuredPost.featuredImage?.asset?.url && (
                <div className={styles.featuredImage}>
                  <Image
                    src={featuredPost.featuredImage.asset.url}
                    alt={featuredPost.featuredImage.alt || featuredPost.title}
                    width={1200}
                    height={600}
                    className={styles.featuredImg}
                  />
                </div>
              )}
              <div className={styles.featuredContent}>
                <span className={styles.featuredBadge}>Featured</span>
                <time className={styles.date}>
                  {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
                <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                {featuredPost.blurb && <p className={styles.featuredBlurb}>{featuredPost.blurb}</p>}
                {featuredPost.author && <p className={styles.author}>By {featuredPost.author.name}</p>}
              </div>
            </Link>
          )}

          {/* Blog Grid */}
          <div className={styles.blogGrid}>
            {regularPosts.map((post) => {
              const date = new Date(post.publishedAt);
              const formattedDate = date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link key={post._id} href={`/insights/blog/${post.slug.current}`} className={styles.blogCard}>
                  {post.featuredImage?.asset?.url && (
                    <div className={styles.cardImage}>
                      <Image
                        src={post.featuredImage.asset.url}
                        alt={post.featuredImage.alt || post.title}
                        width={400}
                        height={250}
                        className={styles.cardImg}
                      />
                    </div>
                  )}
                  <div className={styles.cardContent}>
                    <time className={styles.cardDate}>{formattedDate}</time>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    {post.blurb && <p className={styles.cardBlurb}>{post.blurb}</p>}
                    {post.author && <p className={styles.cardAuthor}>By {post.author.name}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} baseUrl="/insights/blog" />}

        <Breadcrumb />
      </div>
    </>
  );
}
