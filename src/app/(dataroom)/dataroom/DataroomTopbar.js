import { cookies } from 'next/headers';
import Link from 'next/link';
import { Lightlogo } from '@/app/components/icons/lightlogo';
import styles from './dataroom.module.css';
import SignOutButton from './SignOutButton';

export default async function DataroomTopbar() {
  const cookieStore = await cookies();
  const session = cookieStore.get('dataroom-session')?.value;
  const email = session ? session.split(':')[0] : null;

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <Link href="/dataroom" className={styles.logo}>
          <Lightlogo />
        </Link>
        <span className={styles.contextTag}>Data Room</span>
      </div>
      <div className={styles.topbarRight}>
        {email && <span className={styles.userEmail}>{email}</span>}
        <SignOutButton />
      </div>
    </div>
  );
}
