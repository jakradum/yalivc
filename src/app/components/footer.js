import styles from '../styles/footer.module.css';
import Link from 'next/link';
import { FooterLogo } from './icons/footerLogo';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.redSectionFlex}>
        <div className={styles.linksSection}>
          <Link href="/">HOME</Link>
          <Link href="/about-us">ABOUT US</Link>
          <Link href="/investments">INVESTMENTS</Link>
          <Link href="/newsroom">NEWSROOM</Link>
        </div>
        <div className={styles.graphicSection}>
          <FooterLogo />
        </div>
      </div>
      <div className={styles.bottomStrip}>
        <Link href="/">LinkedIn</Link>
        <Link href="/">Media Relations</Link>
        <p>©Yali Capital {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}