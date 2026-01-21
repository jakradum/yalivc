import { getCompanyBySlug, getContentByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { PortableText } from '@portabletext/react';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import companyStyles from './company.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';
import teamLPstyles from '../../../landing page styles/team.module.css';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    return {
      title: 'Company Not Found | Yali Capital',
    };
  }

  return {
    title: `${company.name} | Yali Capital Portfolio`,
    description: company.detail
      ? `${company.detail.substring(0, 155)}...`
      : `${company.name} is a portfolio company of Yali Capital, a deep tech venture capital firm based in Bangalore, India.`,
  };
}

// Portable Text components for story content
const storyComponents = {
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

export default async function CompanyPage({ params }) {
  const { slug, companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const allContent = await getContentByCompany(companySlug);

  return (
    <section>
      <Breadcrumb />

      {/* HEADER */}
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1 className={companyStyles.companyName}>{company.name}</h1>
          <div className={styles.paraFlex}>
            <p>{company.detail}</p>
          </div>

          {company.link && (
            <div style={{ marginTop: '2rem' }}>
              <Button href={company.link} color="black" target="_blank">
                Visit Website
              </Button>
            </div>
          )}
        </article>
        <aside className={`${styles.mainsecGraphic} ${companyStyles.logoAside}`}>
          {company.logo && (
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              fill
              style={{ objectFit: 'contain', transform: 'scale(0.8)' }}
            />
          )}
        </aside>
      </div>

      {/* FOUNDERS + INFO SECTION */}
      {(company.founders?.length > 0 ||
        company.metrics?.length > 0 ||
        company.companyInfo ||
        company.investmentDetails) && (
        <section>
          <div className={styles.people}>
            <HeaderFlex
              title={
                company.founders?.length > 1
                  ? 'Meet the Founders'
                  : company.founders?.length === 1
                    ? 'Meet the Founder'
                    : 'Key Information'
              }
              color="black"
              desktopMaxWidth={'40%'}
              mobileMinHeight={'6rem'}
            />
          </div>

          <div className={companyStyles.founderInfoGrid}>
            {/* Founders Column */}
            <div>
              {company.founders?.map((founder, idx) => (
                <article key={idx} className={`${companyStyles.founderCard} ${company.founders?.length === 1 ? companyStyles.singleFounder : ''}`}>
                  <div className={companyStyles.founderImage}>
                    {founder.photo && (
                      <Image
                        src={founder.photo}
                        alt={founder.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className={companyStyles.founderContent}>
                    <div className={companyStyles.founderHeader}>
                      <h2 className={companyStyles.founderName}>{founder.name}</h2>
                      <p className={companyStyles.founderRole}>{founder.role}</p>
                    </div>
                    {founder.linkedin && (
                      <div className={companyStyles.founderLinkedIn}>
                        <a href={founder.linkedin} target="_blank" rel="noopener noreferrer">
                          <button className={teamLPstyles.socialButton}>in</button>
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Info Column */}
            <div className={companyStyles.infoSection}>
              <h2>Key information</h2>
              <div className={companyStyles.infoGrid}>
                {company.metrics?.map((metric, idx) => (
                  <div key={idx} className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>{metric.label}</p>
                    <p className={companyStyles.metricValue}>{metric.value}</p>
                  </div>
                ))}
                {company.companyInfo?.founded && (
                  <div className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>Founded</p>
                    <p className={companyStyles.metricValue}>{company.companyInfo.founded}</p>
                  </div>
                )}
                {company.companyInfo?.headquarters && (
                  <div className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>Headquarters</p>
                    <p className={companyStyles.metricValue}>{company.companyInfo.headquarters}</p>
                  </div>
                )}
                {company.companyInfo?.teamSize && (
                  <div className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>Team Size</p>
                    <p className={companyStyles.metricValue}>{company.companyInfo.teamSize}</p>
                  </div>
                )}
                {company.investmentDetails?.stage && (
                  <div className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>Investment Stage</p>
                    <p className={companyStyles.metricValue}>{company.investmentDetails.stage}</p>
                  </div>
                )}
                {company.investmentDetails?.date && (
                  <div className={companyStyles.metricCard}>
                    <p className={companyStyles.metricLabel}>Investment Date</p>
                    <p className={companyStyles.metricValue}>
                      {new Date(company.investmentDetails.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INVESTMENT STORY */}
      {company.story?.content && (
        <section className={styles.sectorsSection}>
          <HeaderFlex title="Behind the deal" color="black" desktopMaxWidth={'50%'} mobileMinHeight={'6rem'} />

          <article className={companyStyles.blogArticle}>
            <header className={companyStyles.articleHeader}>
              <h1 className={companyStyles.articleTitle}>{company.story.title}</h1>

              {company.story.author && (
                <div className={companyStyles.articleMeta}>
                  <div className={companyStyles.authorInfo}>
                    <Image
                      src={company.story.author.photo}
                      alt={company.story.author.name}
                      width={48}
                      height={48}
                      className={companyStyles.authorPhoto}
                    />
                    <div>
                      <p className={companyStyles.authorName}>{company.story.author.name}</p>
                      <p className={companyStyles.authorRole}>{company.story.author.role} @ Yali</p>
                    </div>
                  </div>
                </div>
              )}
            </header>

            <div className={companyStyles.articleBody}>
              <PortableText value={company.story.content} components={storyComponents} />
            </div>
          </article>
        </section>
      )}

      {/* MILESTONES */}
      {company.achievements?.length > 0 && (
        <section className={companyStyles.achievementsSection}>
          <HeaderFlex title="Milestones" color="black" desktopMaxWidth={'30%'} mobileMinHeight={'6rem'} />

          <div className={companyStyles.timeline}>
            {[...company.achievements]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((achievement, idx) => (
                <div key={idx} className={companyStyles.timelineItem}>
                  <div className={companyStyles.timelineDate}>
                    {new Date(achievement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </div>
                  <div className={companyStyles.timelineContent}>
                    <h4>{achievement.milestone}</h4>
                    {achievement.description && <p>{achievement.description}</p>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* RELATED CONTENT */}
      {allContent.length > 0 && <hr className={companyStyles.horizontalLine} />}
      {allContent.length > 0 && (
        <section className={styles.sectorsSection} style={{ paddingBottom: 0, marginBottom: '1rem' }}>
          <div className={styles.people}>
            <HeaderFlex title="Related Content" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
          </div>

          <div className={newsStyles.newsArticles}>
            {allContent.map((item) => {
              const date = new Date(item.date);
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.toLocaleString('default', { month: 'short' });
              const year = date.getFullYear();

              return (
                <article key={item._id} className={newsStyles.article}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <p className={newsStyles.articleDate}>{`${day} ${month} ${year}`}</p>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#830D35',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    <p className={newsStyles.articleTitle}>{item.title}</p>
                  </a>
                  <p className={newsStyles.articleMeta}>{item.source}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <Breadcrumb />
    </section>
  );
}
