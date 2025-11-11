import styles from '../about-yali/about-styles.module.css';
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import HeaderFlex from '../components/icons/headerflex';
import { CompaniesInnerComponent } from './companies inner component';
import { getCompanies, getInvestmentPhilosophy, getSectors } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import Link from 'next/link';
import { ArrowLinkOpen } from '../components/icons/small icons/arrowLinkOpen'; // ADD THIS
import Button from '../components/button';

export const revalidate = 60;

export default async function Investments() {
  let companies = [];
  let philosophy = null;
  let sectors = [];

  try {
    companies = await getCompanies();
    philosophy = await getInvestmentPhilosophy();
    sectors = await getSectors();
    console.log('Data fetched:', { companies: companies.length, philosophy: !!philosophy, sectors: sectors.length });
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  return (
    <section>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Our Investments</h1>
          <div className={styles.paraFlex}>
            {philosophy?.philosophyText ? (
              <PortableText value={philosophy.philosophyText} />
            ) : (
              <>
                <p>
                  We focus our investing on Indian deep tech companies across sectors. We believe a deep tech company is
                  one whose moat is its cutting-edge technology that differentiates it from its competitors. And our
                  investments in the past have been in close alignment with this belief, with some of them even going
                  public, listing in Indian stock exchanges.
                </p>
                <p>
                  Our involvement with companies doesn't end with funding; we offer support and mentoring that helps
                  them go to market. Sectors that excite us most include semiconductor, robotics, smart manufacturing,
                  and genomics to name a few.
                </p>
              </>
            )}
          </div>
        </article>
        <aside className={styles.mainsecGraphic}>
          <InvestmentsGraphic />
        </aside>
      </div>

      {/* Sectors Section */}
      {sectors.length > 0 && (
        <section className={styles.sectorsSection}>
          <div className={styles.people}>
            <HeaderFlex title="Investment focus areas" color="black" desktopMaxWidth={'50%'} mobileMinHeight={'8rem'} />
          </div>
          <div className={styles.sectorsGrid}>
            {sectors.slice(0, 4).map((sector) => (
              <Link key={sector._id} href={`/investments/sectors/${sector.slug.current}`} className={styles.sectorCard}>
                <h3>{sector.name}</h3>
                <p>{sector.shortDescription}</p>
              </Link>
            ))}
          </div>
          <div className={`${styles.article} ${styles.readAllButton}`}>
            <Button href="/investments/sectors" color="black">
              View all sectors
            </Button>
          </div>
        </section>
      )}

      {/* Portfolio Companies */}
      <section>
        <div className={styles.people}>
          <HeaderFlex
            title="Our portfolio of companies"
            color="black"
            desktopMaxWidth={'50%'}
            mobileMinHeight={'8rem'}
          />
        </div>
      </section>
      <CompaniesInnerComponent companies={companies} />
    </section>
  );
}
