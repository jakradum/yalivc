import styles from '../about-yali/about-styles.module.css';
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import HeaderFlex from '../components/icons/headerflex';
import { CompaniesInnerComponent } from './companies inner component';
import { getCompanies, getCategories, getInvestmentPhilosophy } from '@/lib/sanity-queries';
import CategoryTable from './CategoryTable'; // Updated path
import Breadcrumb from '../components/breadcrumb';

export const revalidate = 60;

export const metadata = {
  title: 'Our Investments | YALI Capital',
  description: 'Deep tech investments across AI, robotics, semiconductors, and more.',
};

export default async function Investments() {
  let companies = [];
  let categories = [];
  let philosophy = null;

  try {
    [companies, categories, philosophy] = await Promise.all([
      getCompanies(),
      getCategories(),
      getInvestmentPhilosophy()
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  const philosophyText = `Each of these ${categories.length} sectors represents a domain where India has the potential to lead globally. Our investments span across these focus areas, where we bring deep technical expertise and industry networks to help founders scale cutting-edge technology companies.`;

  return (
    <section>
      <Breadcrumb />
      
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Our Investments</h1>
          <div className={styles.paraFlex}>
            <p>
              We focus our investing on Indian deep tech companies across sectors. We believe a deep tech company is one
              whose moat is its cutting-edge technology that differentiates it from its competitors. And our investments
              in the past have been in close alignment with this belief, with some of them even going public, listing in
              Indian stock exchanges.
            </p>
            <p>
              Our involvement with companies doesn't end with funding; we offer support and mentoring that helps them go
              to market. Sectors that excite us most include semiconductor, robotics, smart manufacturing, and genomics
              to name a few.
            </p>
          </div>
        </article>
        <aside className={styles.mainsecGraphic}>
          <InvestmentsGraphic />
        </aside>
      </div>

      {/* Sectors Grid - Replaces old grid */}
      <section className={styles.sectorsSection}>
        <div className={styles.people}>
          <HeaderFlex title="Sectors we invest in" color="black" desktopMaxWidth={'45%'} mobileMinHeight={'4rem'} />
        </div>
        <CategoryTable categories={categories} philosophyText={philosophyText} />
      </section>

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
      
      <Breadcrumb />
    </section>
  );
}