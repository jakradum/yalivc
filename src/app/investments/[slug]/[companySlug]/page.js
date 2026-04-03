import { getCompanyBySlug, getContentByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/sanity/client';
import { PortableText } from '@portabletext/react';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import companyStyles from './company.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Button from '../../../components/button';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { DefenceVector } from '../../../components/icons/background svgs/category svgs/defence vector';
import { GenericVector } from '../../../components/icons/background svgs/category svgs/generic vector';
import { LifeSciencesVector } from '../../../components/icons/background svgs/category svgs/life sciennces vector';
import { RoboticsVector } from '../../../components/icons/background svgs/category svgs/robotics vector';
import { SemiconVector } from '../../../components/icons/background svgs/category svgs/semicon vector';
import { ArtificialIntelligenceVector } from '../../../components/icons/background svgs/category svgs/artificial intelligence vector';
import { AdvancedManufacturingVector } from '../../../components/icons/background svgs/category svgs/advanced manufacturing vector';

export const revalidate = 60;

const categoryVectorMap = {
  'artificial intelligence': ArtificialIntelligenceVector,
  'aerospace and surveillance': DefenceVector,
  'life sciences': LifeSciencesVector,
  'robotics': RoboticsVector,
  'fabless semiconductor': SemiconVector,
  'smart manufacturing': AdvancedManufacturingVector,
  'genomics': LifeSciencesVector,
  'semiconductors': SemiconVector,
  'aerospace': DefenceVector,
  'defence': DefenceVector,
  'fabless chip design': SemiconVector,
  'advanced manufacturing': AdvancedManufacturingVector,
  'generative ai': ArtificialIntelligenceVector,
  'strategic tech': DefenceVector,
};

export async function generateMetadata({ params }) {
  const { slug, companySlug } = await params;
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
    alternates: {
      canonical: `https://yali.vc/investments/${slug}/${companySlug}/`,
    },
  };
}

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

function formatRoundName(round) {
  if (!round?.roundName) return null;
  return round.roundName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatInvestedDate(round) {
  if (!round?.investmentDate) return null;
  return new Date(round.investmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export default async function CompanyPage({ params }) {
  const { slug, companySlug } = await params;
  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const allContent = await getContentByCompany(companySlug);

  const categoryName = company.category?.name?.toLowerCase();
  const HeroVector = categoryVectorMap[categoryName] || GenericVector;

  const roundName = formatRoundName(company.latestRound);
  const investedDate = formatInvestedDate(company.latestRound);

  return (
    <section>
      {/* HERO */}
      <div className={companyStyles.hero}>
        <div className={companyStyles.heroLeft}>
          <div className={companyStyles.heroNameSvg} aria-hidden="true">
            <HeroVector strokeColor="#363636" />
          </div>
          <div className={companyStyles.heroContent}>
            <p className={companyStyles.heroSector}>{company.category?.name}</p>
            <h1 className={companyStyles.heroName}>{company.name}</h1>
            {company.oneLiner && (
              <p className={companyStyles.heroOneLiner}>{company.oneLiner}</p>
            )}
          </div>
          {company.link && (
            <div className={companyStyles.heroFooter}>
              <div className={companyStyles.heroLinkWrapper}>
                <Button href={company.link} color="#830D35" target="_blank">
                  Visit website
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className={companyStyles.heroRight}>
          {company.logo && (
            <div className={companyStyles.heroLogoContainer}>
              <Image
                src={company.logo}
                alt={`${company.name} logo`}
                width={86}
                height={86}
                className={companyStyles.heroLogoImg}
              />
            </div>
          )}
        </div>
      </div>

      {/* METRICS BAR */}
      {(company.companyInfo?.founded || company.companyInfo?.headquarters || roundName || investedDate) && (
        <div className={companyStyles.metricsBar}>
          {company.companyInfo?.founded && (
            <div className={companyStyles.metricCell}>
              <p className={companyStyles.metricsBarLabel}>Founded</p>
              <p className={companyStyles.metricsBarValue}>{company.companyInfo.founded}</p>
            </div>
          )}
          {company.companyInfo?.headquarters && (
            <div className={companyStyles.metricCell}>
              <p className={companyStyles.metricsBarLabel}>Headquarters</p>
              <p className={companyStyles.metricsBarValue}>{company.companyInfo.headquarters}</p>
            </div>
          )}
          {roundName && (
            <div className={companyStyles.metricCell}>
              <p className={companyStyles.metricsBarLabel}>Latest round</p>
              <p className={companyStyles.metricsBarValue}>{roundName}</p>
            </div>
          )}
          {investedDate && (
            <div className={companyStyles.metricCell}>
              <p className={companyStyles.metricsBarLabel}>Invested</p>
              <p className={companyStyles.metricsBarValue}>{investedDate}</p>
            </div>
          )}
        </div>
      )}

      {/* FOUNDERS */}
      {company.founders?.length > 0 && (
        <div className={companyStyles.foundersSection}>
          <p className={companyStyles.foundersLabel}>
            {company.founders.length === 1 ? 'Founder' : 'Founders'}
          </p>
          <div className={companyStyles.foundersGrid}>
            {company.founders.map((founder, idx) => (
              <div key={idx} className={companyStyles.foundersGridCard}>
                {founder.photo && (
                  <div className={companyStyles.founderPhotoWrap}>
                    <Image
                      src={founder.photo}
                      alt={founder.name}
                      width={72}
                      height={72}
                      className={companyStyles.founderPhotoImg}
                    />
                  </div>
                )}
                <div>
                  <p className={companyStyles.foundersGridName}>{founder.name}</p>
                  <p className={companyStyles.foundersGridRole}>{founder.role}</p>
                  {founder.linkedIn && (
                    <div className={companyStyles.founderLinkWrapper}>
                      <Button href={founder.linkedIn} color="#830D35" target="_blank">
                        LinkedIn
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BEHIND THE DEAL */}
      {company.story?.content && (
        <div className={companyStyles.storySection}>
          <p className={companyStyles.storyLabel}>Behind the deal</p>
          <div className={companyStyles.storyCard}>
            <article className={companyStyles.storyArticle}>
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
          </div>
        </div>
      )}

      {/* MILESTONES */}
      {company.achievements?.length > 0 && (
        <div className={companyStyles.milestonesSection}>
          <p className={companyStyles.milestonesLabel}>Milestones</p>
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
        </div>
      )}

      {/* RELATED CONTENT */}
      {allContent.length > 0 && <hr className={companyStyles.horizontalLine} />}
      {allContent.length > 0 && (
        <section className={`${styles.sectorsSection} ${companyStyles.noBottomLine}`} style={{ paddingBottom: 0, marginBottom: '1rem' }}>
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
    </section>
  );
}
