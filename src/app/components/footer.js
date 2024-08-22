import styles from '../styles/footer.module.css';
import Link from 'next/link';
import { FooterLogo } from './icons/footerLogo';
import navigationItemsData from '../navigationItems.json';
import { ArrowLinkOpen } from './icons/small icons/arrowLinkOpen';

export default function Footer() {
  const navigationItems = navigationItemsData.menuItems;

  return (
    <footer className={styles.footer}>
      <div className={styles.redSectionFlex}>
        <div className={styles.contentWrapper}>
            <div className={styles.rowOne}></div>
          <div className={styles.linksSection}>
            {navigationItems.map((item, index) => (
              <div key={index} className={styles.linkBox}>
                <Link href={item.path}>
                  {item.name.toUpperCase()} <ArrowLinkOpen />
                </Link>
              </div>
            ))}
          </div>
          <div className={styles.infoSection}>
            <h3>Yali.VC</h3>
            <p>
              Yali Capital, headquartered in Bangalore India, is a deep tech fund that invests in early stage companies
              across a range of sectors.
            </p>
          </div>
        </div>
        <div className={styles.graphicSection}>
          <FooterLogo />
        </div>
      </div>
      <div className={styles.bottomStrip}>
        <Link href="mailto:hello@yali.com">hello@yali.com</Link>
        <Link href="/">LinkedIn</Link>
        <Link href="/">We're hiring - Get in touch</Link>
        <small>Yali@{new Date().getFullYear()}</small>
      </div>
    </footer>
  );
}