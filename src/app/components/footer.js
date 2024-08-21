import styles from '../styles/footer.module.css';
import Link from 'next/link';
import { FooterLogo } from './icons/footerLogo';
import navigationItemsData from '../navigationItems.json';

export default function Footer() {
  const navigationItems = navigationItemsData.menuItems;

  return (
    <footer className={styles.footer}>
      <div className={styles.redSectionFlex}>
        <div className={styles.linksSection}>
          {navigationItems.map((item, index) => (
            <Link key={index} href={item.path}>
              {item.name.toUpperCase()}
            </Link>
          ))}
        </div>
        <div className={styles.graphicSection}>
          <FooterLogo />
        </div>
      </div>
      <div className={styles.bottomStrip}>
        <Link href="/">LinkedIn</Link>
        <Link href="/">Media Relations</Link>
        <Link href="/">Legal</Link>
        <Link href="/">Careers</Link>
        <p>©Yali Capital {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}