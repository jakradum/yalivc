import { getCompanyBySlug, getContentByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import { PortableText } from '@portabletext/react';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import companyStyles from './company.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';
import detailStyles from '../../../about-yali/detail-styles.module.css'

export const revalidate = 60;

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
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const allContent = await getContentByCompany(slug);

  return (
    <section>
      <Breadcrumb />

      {/* HEADER */}
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <div className={companyStyles.header}>
            {company.logo && (
              <div className={companyStyles.logoContainer}>
                <Image
                  src={urlFor(company.logo).width(120).url()}
                  alt={`${company.name} logo`}
                  width={120}
                  height={120}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
            <h1 className={companyStyles.companyName}>{company.name}</h1>
          </div>

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
      </div>
      {/* FOUNDERS SECTION */}
      {company.founders && company.founders.length > 0 && (
        <section>
          <HeaderFlex
            title={company.founders.length > 1 ? 'Meet the Founders' : 'Meet the Founder'}
            color="black"
            desktopMaxWidth={'40%'}
            mobileMinHeight={'6rem'}
          />
          <div className={detailStyles.teamListContainer}>
            {company.founders.map((founder, idx) => (
              <article key={idx} className={detailStyles.teamMember}>
                <div className={detailStyles.memberInfo}>
                  <div className={detailStyles.header}>
                    <h3 className={detailStyles.name}>{founder.name}</h3>
                    <p className={detailStyles.designation}>{founder.role}</p>
                  </div>
                  <blockquote className={detailStyles.bio}>"{founder.quote}"</blockquote>
                  <div className={detailStyles.viewmoreButton}>
                    {founder.linkedIn && (
                      <Button href={founder.linkedIn} color="#000000">
                        view on linkedin
                      </Button>
                    )}
                  </div>
                </div>
                <div className={detailStyles.memberImage}>
                  <Image
                    src={urlFor(founder.photo).width(300).url()}
                    alt={founder.name}
                    width={300}
                    height={300}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* METRICS + COMPANY INFO */}
      {(company.metrics?.length > 0 || company.companyInfo || company.investmentDetails) && (
        <section className={companyStyles.infoSection}>
          <HeaderFlex title="Key Information" color="black" desktopMaxWidth={'35%'} mobileMinHeight={'6rem'} />
          <div className={companyStyles.infoGrid}>
            {/* Metrics */}
            {company.metrics?.map((metric, idx) => (
              <div key={idx} className={companyStyles.metricCard}>
                <p className={companyStyles.metricLabel}>{metric.label}</p>
                <p className={companyStyles.metricValue}>{metric.value}</p>
              </div>
            ))}

            {/* Company Info */}
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

            {/* Investment Details */}
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
        </section>
      )}

      {/* INVESTMENT STORY */}
      {company.story?.content && (
        <section className={styles.sectorsSection}>
          <div className={companyStyles.storySection}>
            <HeaderFlex title="Behind the deal" color="black" desktopMaxWidth={'50%'} mobileMinHeight={'6rem'} />
            <h2>{company.story.title}</h2>
            {company.story.author && (
              <div className={companyStyles.storyAuthor}>
                <Image
                  src={company.story.author.photo}
                  alt={company.story.author.name}
                  width={50}
                  height={50}
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <p className={companyStyles.authorName}>{company.story.author.name}</p>
                  <p className={companyStyles.authorRole}>{company.story.author.role} @ Yali</p>
                </div>
              </div>
            )}
            <div className={companyStyles.storyContent}>
              <PortableText value={company.story.content} components={storyComponents} />
            </div>
          </div>
        </section>
      )}

      {/* ACHIEVEMENTS */}
      {company.achievements?.length > 0 && (
        <section className={companyStyles.achievementsSection}>
          <HeaderFlex title="Key Milestones" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
          <div className={companyStyles.timeline}>
            {company.achievements.map((achievement, idx) => (
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
