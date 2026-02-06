import styles from '../about-yali/about-styles.module.css'
import { InvestmentsGraphic } from '../components/icons/background svgs/investmentsGraphic';
import HeaderFlex from '../components/icons/headerflex';
import { CompaniesInnerComponent } from './companies inner component';
import { getCompanies } from '@/lib/sanity-queries';
import categories from '../data/categories.json';
export const revalidate = 60;

// Generate SEO-friendly meta description based on categories
const generateMetaDescription = () => {
  const techs = categories.emergingTechnologies;
  const categoryPhrases = techs.slice(0, 4).map(tech =>
    `${tech} investing`
  ).join(', ');

  return `Deep tech venture capital investments in India. Specializing in ${categoryPhrases} and more. Bangalore-based VC firm backing India's tech startups.`;
};

export const metadata = {
  title: 'Our Investments | Deep Tech Venture Capital in India',
  description: generateMetaDescription(),
  keywords: categories.emergingTechnologies.map(tech =>
    `${tech} investing, investing in ${tech} companies`
  ).join(', ') + ', deep tech venture capital, tech investing in India, bangalore venture capital',
  alternates: {
    canonical: 'https://yali.vc/investments/',
  },
};

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
              As a deep tech venture capital firm based in Bangalore, we focus our tech investing on Indian deep tech companies across sectors. We believe a deep tech company is one
              whose moat is its cutting-edge technology that differentiates it from its competitors. Our venture capital investments
              in the past have been in close alignment with this belief, with some of them even going public, listing in
              Indian stock exchanges.{' '}
            </p>
            <p>
              Our involvement with companies doesn't end with funding; we offer support and mentoring that helps them go
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
      <CompaniesInnerComponent companies={companies} />
    </section>
  );
};
