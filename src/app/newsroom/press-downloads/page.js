import styles from './press-downloads.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import Breadcrumb from '../../components/breadcrumb';
import Button from '../../components/button';

export const metadata = {
  title: 'Press Downloads | YALI Capital',
  description: 'Download media assets, logos, and press materials from YALI Capital.',
};

export default function PressDownloads() {
  return (
    <section className={styles.container}>
      <Breadcrumb />

      <div className={styles.header}>
        <HeaderFlex
          title="Media Download Centre"
          color="black"
          desktopMaxWidth={'60%'}
          mobileMaxWidth={'90%'}
        />
        <p className={styles.subtitle}>
          Access our logos, brand assets, and press materials for your coverage.
        </p>
      </div>

      <div className={styles.downloadsGrid}>
        <div className={styles.downloadCard}>
          <h3>Logos</h3>
          <p>YALI Capital logo in various formats (PNG, SVG, EPS)</p>
          <Button href="#" color="black" target="_blank">Download Logos</Button>
        </div>

        <div className={styles.downloadCard}>
          <h3>Brand Guidelines</h3>
          <p>Our brand guidelines including colors, typography, and usage rules</p>
          <Button href="#" color="black" target="_blank">Download Guidelines</Button>
        </div>

        <div className={styles.downloadCard}>
          <h3>Team Photos</h3>
          <p>High-resolution photos of our leadership team</p>
          <Button href="#" color="black" target="_blank">Download Photos</Button>
        </div>

        <div className={styles.downloadCard}>
          <h3>Fact Sheet</h3>
          <p>Key facts and figures about YALI Capital</p>
          <Button href="#" color="black" target="_blank">Download Fact Sheet</Button>
        </div>
      </div>

      <div className={styles.contactSection}>
        <h3>Need something else?</h3>
        <p>For additional press materials or media inquiries, please <a href="/contact">contact us</a>.</p>
      </div>
    </section>
  );
}
