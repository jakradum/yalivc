import styles from '../about-yali/about-styles.module.css'
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import HeaderFlex from '../components/icons/headerflex';
import { CompaniesInnerComponent } from './companies inner component';
import { getCompanies } from '@/lib/sanity-queries';
export const revalidate = 60;

export default async function Investments() {
  let companies = [];
  try {
    companies = await getCompanies();
    console.log('Companies fetched:', companies);
  } catch (error) {
    console.error('Failed to fetch companies:', error);
  }
  
  return (
    // ... rest of code
    <section>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Our Investments</h1>
          <div className={styles.paraFlex}>
            <p>
              We focus our investing on Indian deep tech companies across sectors. We believe a deep tech company is one
              whose moat is its cutting-edge technology that differentiates it from its competitors. And our investments
              in the past have been in close alignment with this belief, with some of them even going public, listing in
              Indian stock exchanges.{' '}
            </p>
            <p>
              Our involvement with companies doesn’t end with funding; we offer support and mentoring that helps them go
              to market. Sectors that excite us most include semiconductor, robotics, smart manufacturing, and genomics
              to name a few.
            </p>
          </div>
        </article>
        <aside className={styles.mainsecGraphic}>
          <InvestmentsGraphic />
        </aside>
      </div>
      <section>
        <div className={styles.people}>
          <HeaderFlex title="Our portfolio of companies" color="black" desktopMaxWidth={'50%'}  mobileMinHeight={'8rem'}/>
        </div>
      </section>
      <CompaniesInnerComponent companies={companies} />
    </section>
  );
};
