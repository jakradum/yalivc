import Link from 'next/link';
import { LightMonogram } from '@/app/components/icons/lightMonogram';
import styles from './dataroom.module.css';
import DataroomHamburger from './DataroomHamburger';

export default function DataroomTopbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <DataroomHamburger />
        <Link href="/dataroom" className={styles.logo}>
          <LightMonogram />
        </Link>
        <Link href="/dataroom" className={styles.contextTag}>
          Investors&rsquo; Data Room
        </Link>
      </div>
    </div>
  );
}
