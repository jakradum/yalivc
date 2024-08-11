import Image from 'next/image';
import styles from './styles/page.module.css';
import Button from './components/button';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
  <div className={styles.heroContent}>
    <h1 className={styles.title}>Taking deep tech to greater heights, one investment at a time.</h1>
    <p className={styles.description}>We believe the next wave of large-scale innovation will have roots in deep tech</p>
  </div>
</section>

<section className={`${styles.section} ${styles.about}`}>
  <h2 className={styles.sectionTitle}>[WE ARE]</h2>
  {/* ... */}
</section>

<section className={`${styles.section} ${styles.companies}`}>
  <h2 className={styles.sectionTitle}>Our companies make us proud</h2>
  <div className={styles.companyGrid}>
    <div className={styles.companyLogo}>Logo 1</div>
    <div className={styles.companyLogo}>Logo 2</div>
    {/* ... */}
  </div>
</section>

      <section className={styles.team}>
        <h2 className={styles.sectionTitle}>Meet the team at Yali Capital</h2>
        <div className={styles.teamGrid}>
          {/* Add team member components here */}
          {/* Example: */}
          {/* <TeamMember name="Ganapathy (Gani) Subramaniam" role="Managing Partner" /> */}
          {/* Repeat for other team members */}
        </div>
      </section>

      <section className={styles.news}>
        <h2 className={styles.sectionTitle}>Recent news</h2>
        <div className={styles.newsGrid}>
          {/* Add news article components here */}
          {/* Example: */}
          {/* <NewsArticle title="Yali Capital launches ₹810 Cr deep-tech fund..." author="PRANAV KARNAD" source="ECONOMIC TIMES" /> */}
          {/* Repeat for other news articles */}
        </div>
      </section>
    </main>
  );
}