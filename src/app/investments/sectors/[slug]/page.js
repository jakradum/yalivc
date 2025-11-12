import styles from '../../../about-yali/about-styles.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import { getSectorBySlug, getCompanies, getNewsBySector } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { CompaniesInnerComponent } from '../../companies inner component';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../../components/breadcrumb';
import newsStyles from '../../../newsroom/newscomponent.module.css';

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
  let news = [];
  
  try {
    sector = await getSectorBySlug(slug);
    
    if (!sector) {
      notFound();
    }
    
    companies = await getCompanies();
    const sectorCompanies = companies.filter(company => {
      const companyCategory = company.category?.name || company.category;
      return companyCategory?.toLowerCase() === sector.name.toLowerCase();
    });
    
    news = await getNewsBySector(slug);
    console.log('Sector ID:', sector._id);
    console.log('News fetched:', news);
    
    return (
      <section>
        <Breadcrumb />

        <div className={styles.mainAbout}>
          <article className={styles.textContent}>
            <h1>{sector.name}</h1>

            {sector.shortDescription && (
              <div className={styles.paraFlex}>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{sector.shortDescription}</p>
              </div>
            )}
          </article>
        </div>

        {sector.overview && (
          <section className={styles.sectorsSection}>
            <div className={styles.people}>
              <HeaderFlex title="Overview" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
            </div>
            <div style={{ padding: '2rem 0', lineHeight: '1.8', fontSize: '1rem' }}>
              <PortableText value={sector.overview} />
            </div>
          </section>
        )}

        {sector.whyYALICares && (
          <section className={styles.sectorsSection}>
            <div className={styles.people}>
              <HeaderFlex title="Why we invest here" color="black" desktopMaxWidth={'50%'} mobileMinHeight={'6rem'} />
            </div>
            <div style={{ padding: '2rem 0', lineHeight: '1.8', fontSize: '1rem' }}>
              <PortableText value={sector.whyYALICares} />
            </div>
          </section>
        )}

        {sectorCompanies.length > 0 && (
          <section>
            <div className={styles.people}>
              <HeaderFlex title="Portfolio companies" color="black" desktopMaxWidth={'50%'} mobileMinHeight={'8rem'} />
            </div>
            <CompaniesInnerComponent companies={sectorCompanies} />
          </section>
        )}

        {news.length > 0 && (
          <section className={styles.sectorsSection} style={{ paddingBottom: 0, marginBottom: "1rem" }}>
            <div className={styles.people}>
              <HeaderFlex title="Related News" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
            </div>

            <div
              className={newsStyles.newsArticles}
              style={{
                gridTemplateColumns: `repeat(${news.length}, 1fr)`,
                marginBottom: 0,
              }}
            >
              {news.map((article) => {
                const date = new Date(article.date);
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('default', { month: 'short' });
                const year = date.getFullYear();

                return (
                  <article key={article._id} className={newsStyles.article}>
                    <p className={newsStyles.articleDate}>{`${day} ${month} ${year}`}</p>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <p className={newsStyles.articleTitle}>{article.headlineEdited}</p>
                    </a>
                    <p className={newsStyles.articleMeta}>{article.publicationName}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    );
  } catch (error) {
    console.error('Error loading sector page:', error);
    notFound();
  }
}
