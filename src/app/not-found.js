import Image from 'next/image';
import Link from 'next/link';
import styles from './styles/not-found.module.css';

export const metadata = {
  title: '404 — Yali Capital',
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.graphic}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/Schwarzschild.png"
          alt="Wireframe torus"
          className={styles.image}
        />
      </div>
      <h1 className={styles.heading}>
        You&rsquo;re in the 404<sup>th</sup> dimension
      </h1>
      <p className={styles.sub}>
        The page you&rsquo;re looking for may have crossed the event horizon.
      </p>
      <Link href="/" className={styles.link}>
        Go back to yali.vc
      </Link>
    </div>
  );
}
