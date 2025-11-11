import styles from '../about-styles.module.css';
import Breadcrumb from '../../components/breadcrumb';
import HeaderFlex from '@/app/components/icons/headerflex';

export const metadata = {
  title: 'FAQ | YALI Capital',
  description: 'Frequently asked questions about YALI Capital',
};

export default function FAQPage() {
  return (
    <section>
      <Breadcrumb />
      
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <HeaderFlex title="Frequently asked questions" color="black" desktopMaxWidth="45%" />
          <div className={styles.paraFlex}>
            <p>Find answers to common questions about YALI Capital.</p>
          </div>
        </article>
      </div>
    </section>
  );
}