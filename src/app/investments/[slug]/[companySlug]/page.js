import { getCompanyBySlug, getContentByCompany } from '@/lib/sanity-queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import styles from './company.module.css';
import { PortableText } from '@portabletext/react';
import { urlFor } from '@/sanity/client';
import Link from 'next/link';
import Button from '@/app/components/button';

// Custom serializers for PortableText
const portableTextComponents = {
  block: {
    h1: ({children}) => <h1 className={styles.storyHeading}>{children}</h1>,
    h2: ({children}) => <h2>{children}</h2>,
    h3: ({children}) => <h3>{children}</h3>,
    normal: ({children}) => <p>{children}</p>,
  },
  marks: {
    link: ({value, children}) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
      return (
        <a href={value?.href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({value}) => {
      if (!value?.asset) return null;
      return (
        <figure className={styles.storyImage}>
          <Image
            src={urlFor(value).url()}
            alt={value.alt || ''}
            width={800}
            height={500}
            style={{ width: '100%', height: 'auto' }}
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      );
    },
  },
};

export async function generateMetadata({ params }) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    return {
      title: 'Company Not Found',
    };
  }

  return {
    title: `${company.name} | Yali Capital Portfolio`,
    description: company.detail || `${company.name} - Portfolio company of Yali Capital`,
  };
}

export default async function CompanyPage({ params }) {
  const { companySlug, slug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  // Get related content (news/blog posts about this company)
  const relatedContent = await getContentByCompany(companySlug);

  return (
    <main>
      {/* Breadcrumb */}
      <nav style={{ padding: '1rem 2rem', fontSize: '0.875rem' }}>
        <Link href="/investments" style={{ color: '#830D35' }}>Investments</Link>
        {' > '}
        <Link href={`/investments/${slug}`} style={{ color: '#830D35' }}>
          {company.category?.name || 'Category'}
        </Link>
        {' > '}
        <span>{company.name}</span>
      </nav>

      {/* Company Header */}
      <aside className={styles.logoAside}>
        {company.logo && (
          <Image
            src={company.logo}
            alt={company.name}
            fill
            style={{ objectFit: 'contain' }}
          />
        )}
      </aside>

      <div className={styles.header}>
        <h1 className={styles.companyName}>{company.name}</h1>
      </div>

      {/* Founder + Info Grid */}
      <div className={styles.founderInfoGrid}>
        {/* Founders Container */}
        <div className={company.founders?.length === 1 ? styles.singleFounder : ''}>
          {company.founders?.map((founder, index) => (
            <div key={index} className={styles.founderCard}>
              <div className={styles.founderImage}>
                {founder.photo && (
                  <Image
                    src={founder.photo}
                    alt={founder.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className={styles.founderContent}>
                <div className={styles.founderHeader}>
                  <div className={styles.founderName}>{founder.name}</div>
                  <div className={styles.founderRole}>{founder.role}</div>
                </div>
                {founder.linkedin && (
                  <div className={styles.founderLinkedIn}>
                    <Button href={founder.linkedin} color="black" target="_blank">
                      LinkedIn
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section - Key Information */}
        <aside className={styles.infoSection}>
          <h2>Key Information</h2>
          <div className={styles.infoGrid}>
            {company.yearFounded && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Year Founded</div>
                <div className={styles.metricValue}>{company.yearFounded}</div>
              </div>
            )}
            {company.headquarters && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Headquarters</div>
                <div className={styles.metricValue}>{company.headquarters}</div>
              </div>
            )}
            {company.industry && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Industry</div>
                <div className={styles.metricValue}>{company.industry}</div>
              </div>
            )}
            {company.stage && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Stage</div>
                <div className={styles.metricValue}>{company.stage}</div>
              </div>
            )}
            {company.category?.name && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Sector</div>
                <div className={styles.metricValue}>{company.category.name}</div>
              </div>
            )}
            {company.website && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Website</div>
                <div className={styles.metricValue}>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ebde84', textDecoration: 'none' }}
                  >
                    Visit Site
                  </a>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <hr className={styles.horizontalLine} />

      {/* Investment Story */}
      {company.story && (
        <section className={styles.storySection}>
          <h2>The Story</h2>
          <div className={styles.storyContent}>
            <PortableText
              value={company.story}
              components={portableTextComponents}
            />
          </div>
        </section>
      )}

      {/* Milestones/Achievements Timeline */}
      {company.milestones && company.milestones.length > 0 && (
        <>
          <hr className={styles.horizontalLine} />
          <section className={styles.achievementsSection}>
            <h2>Key Milestones</h2>
            <div className={styles.timeline}>
              {company.milestones.map((milestone, index) => (
                <div key={index} className={styles.timelineItem}>
                  <div className={styles.timelineDate}>
                    <strong>{milestone.date}</strong>
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>{milestone.title}</h4>
                    <p>{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Behind the Deal Article (if available) */}
      {company.behindTheDeal && (
        <>
          <hr className={styles.horizontalLine} />
          <section style={{ padding: '2rem' }}>
            <article className={styles.blogArticle}>
              <header className={styles.articleHeader}>
                <h2 className={styles.articleTitle}>Behind the Deal</h2>
                {company.behindTheDeal.author && (
                  <div className={styles.articleMeta}>
                    <div className={styles.authorInfo}>
                      {company.behindTheDeal.author.photo && (
                        <Image
                          src={company.behindTheDeal.author.photo}
                          alt={company.behindTheDeal.author.name}
                          width={48}
                          height={48}
                          className={styles.authorPhoto}
                        />
                      )}
                      <div>
                        <p className={styles.authorName}>
                          {company.behindTheDeal.author.name}
                        </p>
                        <p className={styles.authorRole}>
                          {company.behindTheDeal.author.role}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </header>
              <div className={styles.articleBody}>
                <PortableText
                  value={company.behindTheDeal.content}
                  components={portableTextComponents}
                />
              </div>
              {company.behindTheDeal.author && (
                <div className={styles.authorCard}>
                  {company.behindTheDeal.author.photo && (
                    <Image
                      src={company.behindTheDeal.author.photo}
                      alt={company.behindTheDeal.author.name}
                      width={64}
                      height={64}
                      className={styles.authorPhoto}
                    />
                  )}
                  <div>
                    <p className={styles.authorName}>
                      {company.behindTheDeal.author.name}
                    </p>
                    <p className={styles.authorRole}>
                      {company.behindTheDeal.author.role}
                    </p>
                  </div>
                </div>
              )}
            </article>
          </section>
        </>
      )}

      {/* Related Content */}
      {relatedContent && relatedContent.length > 0 && (
        <>
          <hr className={styles.horizontalLine} />
          <section style={{ padding: '2rem 0' }}>
            <h2 style={{ padding: '0 2rem', marginBottom: '2rem' }}>Related News & Insights</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              backgroundColor: '#f5f5f5',
              border: '0.5px solid black',
              borderBottom: 'none',
              borderRight: 'none'
            }}>
              {relatedContent.map((item, index) => (
                <article key={index} style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: '0.5px solid black',
                  borderBottom: '0.5px solid black',
                  minHeight: '200px',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                    {item.source} • {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    marginBottom: '2.5rem',
                    flexGrow: 1,
                    position: 'relative',
                    wordBreak: 'break-word'
                  }}>
                    {item.title}
                    <span style={{
                      content: '',
                      position: 'absolute',
                      bottom: '-1rem',
                      left: 0,
                      height: '0.3rem',
                      width: '4rem',
                      backgroundColor: '#830D35',
                      display: 'block'
                    }}></span>
                  </h3>
                  {item.isExternal ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                      textDecoration: 'none',
                      color: '#333',
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      marginTop: 'auto'
                    }}>
                      READ ARTICLE →
                    </a>
                  ) : (
                    <Link href={item.url} style={{
                      textDecoration: 'none',
                      color: '#333',
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      marginTop: 'auto'
                    }}>
                      READ MORE →
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
