import Image from 'next/image';
import styles from './styles/page.module.css';
import Button from './components/button';
import CompanyShowcase from './components/showcase';



const companyNames = [
  'Company1',
  'Company2',
  'Company3',
  'Company4',
  'Company5',
  'Company6',
];

// Base URL for logo images
const BASE_LOGO_URL = 'https://yali.vc/wp-content/uploads/2023/10/cosmic-circuits-1.png';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Taking deep tech to greater heights, one investment at a time.</h1>
          <p className={styles.description}>
            We believe the next wave of large-scale innovation will have roots in deep tech
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.about}`}>
        <h2 className={styles.sectionTitle}>[WE ARE]</h2>
        <div className={styles.aboutContent}>
          <div className={styles.aboutBox}>
            <p>
              Yali Capital is helmed by a team of experts from the world of deep tech with a razor-sharp focus on
              early-stage companies. We help nurture startups through funding, mentorship, and access to a network of
              innovators and industry leaders. The core team at Yali Capital includes people from a range of backgrounds
              such as Semiconductor, Life Sciences, Machine Learning, and Venture Capital.
            </p>
          </div>
        </div>
      </section>

      <section>
        <CompanyShowcase/>
      </section>

      <section className={styles.team}>
        <h2 className={styles.sectionTitle}>Meet the team at Yali Capital</h2>
        <div className={styles.teamGrid}>
        </div>
      </section>

      <section className={styles.news}>
        <h2 className={styles.sectionTitle}>Recent news</h2>
        <div className={styles.newsGrid}>

        </div>
      </section>
    </main>
  );
}
