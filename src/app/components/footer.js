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
          <div className={styles.linksSection}>
            {navigationItems.map((item, index) => (
              <div className={styles.linkBox}>
                <Link key={index} href={item.path}>
                  {item.name.toUpperCase()} <ArrowLinkOpen />
                </Link>
              </div>
            ))}
          </div>
          <div>
            <h3>Yali.VC</h3>
            <p>
              Yali Capital is a deep tech fund headquartered at Bangalore, India. We invest in early stage deep tech
              startups across a range of verticals from Aerospace to Robotics
            </p>
          </div>
          
        </div>
        <div className={styles.bottomStrip}>
          <Link href="/">LinkedIn</Link>
          <Link href="/">Media Relations</Link>
          <Link href="/">Legal</Link>
          <Link href="/">Careers</Link>
          <small>©Yali Capital {new Date().getFullYear()}</small>
        </div>
        <div className={styles.graphicSection}>
            <FooterLogo />
          </div>
      </div>
    </footer>
  );
}