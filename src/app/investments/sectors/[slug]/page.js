import styles from '../../../about-yali/about-styles.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import { getSectorBySlug, getCompanies, getContentBySector } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { CompaniesInnerComponent } from '../../companies inner component';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../../components/breadcrumb';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import { RoboticsVector } from '@/app/components/icons/background svgs/category svgs/robotics vector';
import { GenomicsVector } from '@/app/components/icons/background svgs/category svgs/genomics vector';
import { SemiconVector } from '@/app/components/icons/background svgs/category svgs/semicon vector';
import { GenericVector } from '@/app/components/icons/background svgs/category svgs/generic vector';
import { ArtificialIntelligenceVector } from '@/app/components/icons/background svgs/category svgs/artificial intelligence vector';
import { DefenceVector } from '@/app/components/icons/background svgs/category svgs/defence vector';
import { FablessChipVector } from '@/app/components/icons/background svgs/category svgs/fabless chip vector';
import { AdvancedManufacturingVector } from '@/app/components/icons/background svgs/category svgs/advanced manufacturing vector';
import { GenerativeAIVector } from '@/app/components/icons/background svgs/category svgs/generative AI vector';
import { LifeSciencesVector } from '@/app/components/icons/background svgs/category svgs/life sciennces vector';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const sector = await getSectorBySlug(slug);

  if (!sector) {
    return {
      title: 'Sector Not Found | YALI Capital',
    };
  }

  return {
    title: `${sector.name} | YALI Capital`,
    description: sector.shortDescription || `Learn about YALI Capital's investments in ${sector.name}`,
  };
}

export default async function SectorPage({ params }) {
  const { slug } = await params;
  let sector = null;
  let companies = [];
  let allContent = [];

  try {
    sector = await getSectorBySlug(slug);

    if (!sector) {
      notFound();
    }

    companies = await getCompanies();
    const sectorCompanies = companies.filter((company) => {
      const companyCategory = company.category?.name || company.category;
      return companyCategory?.toLowerCase() === sector.name.toLowerCase();
    });

    allContent = await getContentBySector(slug);

    return (
      <section className={styles.sectionLevel}>
        <Breadcrumb />

        <div className={styles.mainAbout}>
          <article className={styles.textContent}>
            <h1>{sector.name}</h1>
            {sector.overview && (
              <div className={styles.paraFlex}>
                <PortableText value={sector.overview} />
              </div>
            )}
          </article>
          <aside className={styles.mainsecGraphic}>
            <div
              style={{
                width: '500px',
                height: '500px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sector.name.toLowerCase() === 'robotics' && (
                <RoboticsVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'genomics' && (
                <GenomicsVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'semiconductors' && (
                <SemiconVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'aerospace & defence' && (
                <DefenceVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'artificial intelligence' && (
                <ArtificialIntelligenceVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'defence' && (
                <DefenceVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'fabless chip design' && (
                <FablessChipVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'advanced manufacturing' && (
                <AdvancedManufacturingVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'generative ai' && (
                <GenerativeAIVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
              {sector.name.toLowerCase() === 'life sciences' && (
                <LifeSciencesVector style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </aside>
        </div>

        {sector.whyYALICares && (
          <section>
            <HeaderFlex title="Why we invest" color="black" desktopMaxWidth={'30%'} mobileMinHeight={'0rem'} />
            <div style={{ padding: ' 0 2rem ', lineHeight: '1.8', fontSize: '1rem' }}>
              <PortableText value={sector.whyYALICares} />
            </div>
            <div className={styles.people}></div>
          </section>
        )}

        {sectorCompanies.length > 0 && (
          <section>
            <HeaderFlex title="Portfolio companies" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'0rem'} />
            <CompaniesInnerComponent companies={sectorCompanies} />
          </section>
        )}

        {allContent.length > 0 && (
          <section id="content">
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
  } catch (error) {
    console.error('Error loading sector page:', error);
    notFound();
  }
}
