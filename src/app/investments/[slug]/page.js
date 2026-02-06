import styles from '../../about-yali/about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getCategoryBySlug, getCompanies, getContentByCategory } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { CompaniesInnerComponent } from '../companies inner component';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../components/breadcrumb';
import newsStyles from '../../newsroom/newscomponent.module.css';
import { RoboticsVector } from '@/app/components/icons/background svgs/category svgs/robotics vector';
import { SemiconVector } from '@/app/components/icons/background svgs/category svgs/semicon vector';
import { GenericVector } from '@/app/components/icons/background svgs/category svgs/generic vector';
import { ArtificialIntelligenceVector } from '@/app/components/icons/background svgs/category svgs/artificial intelligence vector';
import { DefenceVector } from '@/app/components/icons/background svgs/category svgs/defence vector';
import { AdvancedManufacturingVector } from '@/app/components/icons/background svgs/category svgs/advanced manufacturing vector';
import { LifeSciencesVector } from '@/app/components/icons/background svgs/category svgs/life sciennces vector';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Sector Not Found | YALI Capital',
    };
  }

  return {
    title: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} | Yali Capital`,
    description: category.description || `Learn about YALI Capital's investments in ${category.name}`,
    alternates: {
      canonical: `https://yali.vc/investments/${slug}/`,
    },
  };
}

export default async function SectorPage({ params }) {
  const { slug } = await params;

  try {
    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    const companies = await getCompanies();
    const categoryCompanies = companies.filter((company) => {
      const companyCategory = company.category?.name?.toLowerCase();
      return companyCategory === category.name.toLowerCase();
    });

    const allContent = await getContentByCategory(slug);

    const categoryVectorMap = {
      // New 6 categories
      'artificial intelligence': ArtificialIntelligenceVector,
      'aerospace and surveillance': DefenceVector,
      'life sciences': LifeSciencesVector,
      'robotics': RoboticsVector,
      'fabless semiconductor': SemiconVector,
      'smart manufacturing': AdvancedManufacturingVector,
      // Legacy mappings (for backward compatibility during migration)
      'genomics': LifeSciencesVector,
      'semiconductors': SemiconVector,
      'aerospace': DefenceVector,
      'defence': DefenceVector,
      'fabless chip design': SemiconVector,
      'advanced manufacturing': AdvancedManufacturingVector,
      'generative ai': ArtificialIntelligenceVector,
      'strategic tech': DefenceVector,
    };

    const VectorComponent = categoryVectorMap[category.name.toLowerCase()] || GenericVector;

    return (
      <section className={styles.sectionLevel}>
        <Breadcrumb />

        <div className={styles.mainAbout}>
          <article className={styles.textContent}>
            <h1>{category.name}</h1>
            {category.overview && (
              <div className={styles.paraFlex}>
                <PortableText value={category.overview} />
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
              <VectorComponent style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </aside>
        </div>

        {category.whyYALICares && (
          <section className={styles.people}>
            <HeaderFlex title="Why we invest" color="black" desktopMaxWidth={'30%'} mobileMinHeight={'0rem'} />
            <div className={styles.textContent}>
              <PortableText value={category.whyYALICares} />
            </div>
          </section>
        )}

        {categoryCompanies.length > 0 && (
          <section>
            <HeaderFlex title="Portfolio companies" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'0rem'} />
            <CompaniesInnerComponent companies={categoryCompanies} />
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
    console.error('Error loading category page:', error);
    notFound();
  }
}
