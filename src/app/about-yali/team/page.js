import styles from '../about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import Breadcrumb from '../../components/breadcrumb';

export const metadata = {
  title: 'Our Team | YALI Capital',
  description: 'Meet the team behind YALI Capital',
};

export default function TeamPage() {
  return (
    <section>
      <Breadcrumb />
      
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Our Team</h1>
          <div className={styles.paraFlex}>
            <p>Meet the people behind YALI Capital.</p>
          </div>
        </article>
      </div>

      <section className={styles.sectorsSection}>
        <div className={styles.people}>
          <HeaderFlex title="Team members" color="black" desktopMaxWidth="45%" />
        </div>
        {/* Add team members here */}
      </section>
    </section>
  );
}