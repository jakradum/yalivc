import styles from '../../../about-yali/about-styles.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import { getSectorBySlug, getCompanies, getNewsBySector } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { CompaniesInnerComponent } from '../../companies inner component';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../../components/breadcrumb';

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
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                  {sector.shortDescription}
                </p>
              </div>
            )}
          </article>
        </div>
        
        {sector.overview && (
          <section className={styles.sectorsSection}>
            <div className={styles.people}>
              <HeaderFlex 
                title="Overview" 
                color="black" 
                desktopMaxWidth={'40%'} 
                mobileMinHeight={'6rem'}
              />
            </div>
            <div style={{ padding: '2rem 0', lineHeight: '1.8', fontSize: '1rem' }}>
              <PortableText value={sector.overview} />
            </div>
          </section>
        )}
        
        {sector.whyYALICares && (
          <section className={styles.sectorsSection}>
            <div className={styles.people}>
              <HeaderFlex 
                title="Why we invest here" 
                color="black" 
                desktopMaxWidth={'50%'} 
                mobileMinHeight={'6rem'}
              />
            </div>
            <div style={{ padding: '2rem 0', lineHeight: '1.8', fontSize: '1rem' }}>
              <PortableText value={sector.whyYALICares} />
            </div>
          </section>
        )}
        
        {sectorCompanies.length > 0 && (
          <section>
            <div className={styles.people}>
              <HeaderFlex 
                title="Portfolio companies" 
                color="black" 
                desktopMaxWidth={'50%'} 
                mobileMinHeight={'8rem'}
              />
            </div>
            <CompaniesInnerComponent companies={sectorCompanies} />
          </section>
        )}
        
        {news.length > 0 && (
          <section className={styles.sectorsSection}>
            <div className={styles.people}>
              <HeaderFlex
                title="Related News"
                color="black"
                desktopMaxWidth={'50%'}
                mobileMinHeight={'6rem'}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 0' }}>
              {news.map((article) => (
                <a 
                  key={article._id} 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ flexShrink: 0, fontSize: '0.875rem', color: '#666', width: '100px' }}>
                    {new Date(article.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#830D35' }}>
                      {article.headlineEdited}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                      {article.publicationName}
                    </p>
                  </div>
                  {article.isVideo && (
                    <span style={{
                      flexShrink: 0,
                      padding: '0.25rem 0.75rem',
                      background: '#830D35',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      alignSelf: 'flex-start'
                    }}>
                      VIDEO
                    </span>
                  )}
                </a>
              ))}
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
