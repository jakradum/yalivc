import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import '../styles/globals.css';
import styles from './partners.module.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Partners Portal | Yali Capital',
  description: 'LP Partners Portal - Quarterly Reports and Fund Updates',
  robots: 'noindex, nofollow', // Don't index partners portal
};

export default function PartnersLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <div className={styles.portalWrapper}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <Link href="/partners" className={styles.logoLink}>
                <svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.logo}
                >
                  <text
                    x="0"
                    y="30"
                    fill="#830D35"
                    fontFamily="var(--font-jetbrains-mono)"
                    fontSize="24"
                    fontWeight="600"
                  >
                    YALI
                  </text>
                </svg>
              </Link>
              <div className={styles.headerRight}>
                <span className={styles.portalLabel}>Partners Portal</span>
                <span className={styles.confidentialBadge}>CONFIDENTIAL</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={styles.main}>
            {children}
          </main>

          {/* Footer */}
          <footer className={styles.footer}>
            <p>© {new Date().getFullYear()} Yali Capital. All rights reserved.</p>
            <p className={styles.footerNote}>
              This portal and its contents are confidential and intended solely for authorized Limited Partners.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
