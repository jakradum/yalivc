import styles from '../../about-yali/about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getSectors } from '@/lib/sanity-queries';
import Link from 'next/link';
import Breadcrumb from '../../components/breadcrumb';

export const revalidate = 60;

export const metadata = {
  title: 'Investment Sectors | YALI Capital',
  description: 'Explore our investment focus areas across deep tech sectors including AI, genomics, semiconductors, robotics, and more.',
};

export default async function SectorsPage() {
  let sectors = [];

  try {
    sectors = await getSectors();
    console.log('Sectors fetched:', sectors.length);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
  
  return (
    <section>
      <Breadcrumb />
      
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Investment Focus</h1>
          <div className={styles.paraFlex}>
            <p>
              We invest in deep tech companies across multiple sectors where cutting-edge technology creates 
              sustainable competitive advantages. Our focus areas represent the future of innovation in India.
            </p>
            <p>
              Each sector represents a domain where we bring deep expertise, networks, and strategic value 
              beyond capital. Explore our investment focus areas below.
            </p>
          </div>
        </article>
      </div>

      <section className={styles.sectorsSection}>
        <div className={styles.people}>
          <HeaderFlex 
            title="Our sectors" 
            color="black" 
            desktopMaxWidth={'40%'} 
            mobileMinHeight={'6rem'}
          />
        </div>
        
        {sectors.length > 0 ? (
          <div className={styles.sectorsGrid}>
            {sectors.map((sector) => (
              <Link
                key={sector._id}
                href={`/investments/sectors/${sector.slug.current}`}
                className={styles.sectorCard}
              >
                <h3>{sector.name}</h3>
                <p>{sector.shortDescription}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>No sectors available at the moment.</p>
          </div>
        )}
      </section>

      <Breadcrumb />
    </section>
  );
}