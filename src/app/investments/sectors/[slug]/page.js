import styles from '../../../about-yali/about-styles.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import { getSectorBySlug, getCompanies } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import { CompaniesInnerComponent } from '../../companies inner component';
import { notFound } from 'next/navigation';
import Breadcrumb from '../../../components/breadcrumb';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const sector = await getSectorBySlug(params.slug);
  
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
  let sector = null;
  let companies = [];
  
  try {
    sector = await getSectorBySlug(params.slug);
    
    if (!sector) {
      notFound();
    }
    
    companies = await getCompanies();
    console.log('Sector page loaded:', sector.name);
  } catch (error) {
    console.error('Failed to fetch sector data:', error);
    notFound();
  }
  
  return (
    <section>
      <Breadcrumb />
      
      {/* Hero Section */}
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>{sector.name}</h1>
          <div className={styles.paraFlex}>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              {sector.shortDescription}
            </p>
          </div>
        </article>
      </div>

      {/* Overview Section */}
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

      {/* Why YALI Cares Section */}
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

      {/* Related Companies */}
      {companies.length > 0 && (
        <section>
          <div className={styles.people}>
            <HeaderFlex 
              title="Portfolio companies" 
              color="black" 
              desktopMaxWidth={'50%'} 
              mobileMinHeight={'8rem'}
            />
          </div>
          <CompaniesInnerComponent companies={companies} />
        </section>
      )}
      <Breadcrumb />
    </section>
  );
}