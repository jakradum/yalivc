import Image from 'next/image';
import styles from './styles/page.module.css';
import Button from './components/button';
import CompanyShowcase from './components/showcase';
import { DottedLogoGraphic } from './components/icons/dotted logo graphic';
import { ViewfinderIcon } from './components/icons/small icons/viewfinder icon';

const companyNames = ['Company1', 'Company2', 'Company3', 'Company4', 'Company5', 'Company6'];

// Base URL for logo images
const BASE_LOGO_URL = 'https://yali.vc/wp-content/uploads/2023/10/cosmic-circuits-1.png';

export default function Home() {
  return (
    <main>
      <section className={styles.heroSection}>
        <aside className={styles.contentWrapper}>
          <div className={styles.headingBox}>
            <p>
              We believe the next wave of large-scale innovation will have roots in deep tech. With investments across
              sectors like Semiconductors, Robotics, Genomics, Aerospace, and AI, we’re helping India’s startups build
              for the future, and we’re only getting started.
            </p>
            <ViewfinderIcon/>
            <h1>Taking Indian deep tech to new heights. One investment at a time.</h1>
            <ViewfinderIcon />
          </div>
        </aside>
        <aside className={styles.graphicWrapper}>
            <DottedLogoGraphic />
        </aside>
      </section>
    </main>
  );
}
