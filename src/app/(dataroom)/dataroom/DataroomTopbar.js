import Link from 'next/link';
import { Lightlogo } from '@/app/components/icons/lightlogo';
import styles from './dataroom.module.css';
import DataroomHamburger from './DataroomHamburger';

export default function DataroomTopbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <DataroomHamburger />
        <Link href="/dataroom" className={styles.logo}>
          <Lightlogo />
        </Link>
        <Link href="/dataroom" className={styles.contextTag}>
          Investors&rsquo; Data Room
        </Link>
      </div>
    </div>
  );
}
