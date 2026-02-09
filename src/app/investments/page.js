import styles from '../about-yali/about-styles.module.css'
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import HeaderFlex from '../components/icons/headerflex';
import { CompaniesInnerComponent } from './companies inner component';
import { getCompanies, getCategories } from '@/lib/sanity-queries';
export const revalidate = 60;

export const metadata = {
  title: 'Our Investments | Deep Tech Venture Capital in India',
  description: 'Deep tech venture capital investments in India. Specializing in robotics, AI, semiconductors, genomics and more. Bangalore-based VC firm backing India\'s tech startups.',
  keywords: 'deep tech venture capital, tech investing in India, bangalore venture capital, robotics investing, AI investing, semiconductor investing',
  alternates: {
    canonical: 'https://yali.vc/investments/',
  },
};

export default async function Investments() {
  let companies = [];
  let categories = [];
  try {
    [companies, categories] = await Promise.all([
      getCompanies(),
      getCategories()
    ]);
    console.log('Companies fetched:', companies);
    console.log('Categories fetched:', categories);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  return (
    <section>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Our Investments</h1>
          <div className={styles.paraFlex}>
            <p>
              As a deep tech venture capital firm based in Bangalore, we focus our tech investing on Indian deep tech companies across sectors. We believe a deep tech company is one
              whose moat is its cutting-edge technology that differentiates it from its competitors. Our venture capital investments
              in the past have been in close alignment with this belief, with some of them even going public, listing in
              Indian stock exchanges.{' '}
            </p>
            <p>
              Our involvement with companies doesn&apos;t end with funding; we offer support and mentoring that helps them go
              to market. Sectors that excite us most include robotics investing, AI investing, semiconductor investing, smart manufacturing, and genomics investing
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
      <CompaniesInnerComponent companies={companies} categories={categories} />
    </section>
  );
}
