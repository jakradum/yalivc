import styles from '../styles/footer.module.css';
import Link from 'next/link';
import { FooterLogo } from './icons/footerLogo';
import navigationItemsData from '../navigationItems.json';
import { ArrowLinkOpen } from './icons/small icons/arrowLinkOpen';

export default function Footer() {
  const navigationItems = navigationItemsData.menuItems;

  const BottomStripContent = () => (
    <>
      <Link href="mailto:media-relations@yali.vc">Press inquiries</Link>
      <Link href="https://www.linkedin.com/company/yali-capital/" target='_blank'>Follow us on LinkedIn</Link>
      <Link href="/investor-relations">Investor Relations</Link>
      <small>© Yali Capital {new Date().getFullYear()}</small>
    </>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.redSectionFlex}>
        <div className={styles.contentWrapper}>
          <div className={styles.gridContainer}>
            <div className={styles.emptyGrid}></div>
            <div className={styles.emptyGrid}></div>
            <div className={styles.linksSection}>
              {navigationItems.map((item, index) => (
                <div key={index} className={styles.linkBox}>
                  <Link href={item.path}>
                    {item.name.toUpperCase()} <ArrowLinkOpen />
                  </Link>
                </div>
              ))}
            </div>
            <div className={styles.emptyGridSide}></div>
            <div className={styles.emptyGridSide}></div>
            <div className={styles.emptyGridSide}></div>
            <div className={styles.infoSection}>
              <h3>Yali.VC</h3>
              <p>
              Yali Capital, headquartered in Bangalore, India, invests in early stage deep tech startups across a wide
              range of verticals from Aerospace to Robotics.
              </p>
            </div>
          </div>
          <div className={` ${styles.mobileBottomStrip}`}>
            <BottomStripContent />
          </div>
        </div>
        <div className={styles.graphicSection}>
          <FooterLogo />
        </div>
      </div>
      <div className={`${styles.desktopBottomStrip}`}>
        <BottomStripContent />
      </div>
    </footer>
  );
}