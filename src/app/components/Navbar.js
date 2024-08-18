'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Navbar.module.css';
import { Logo } from './logo';
import { Lightlogo } from './lightlogo';

const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    const handleRouteChange = () => {
      setMenuOpen(false);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  return (
    <nav className={`${styles.navbar} ${isSticky ? styles.sticky : ''} ${isMobile && isMenuOpen ? styles.expanded : ''}`}>
      {isMobile ? (
        <>
          <div className={styles.mobileNavContent}>
            <div className={styles.mobileLogo}>
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Lightlogo />
              </Link>
            </div>
            <button className={styles.menuToggle} onClick={toggleMenu}>
              {isMenuOpen ? '×' : '☰'}
            </button>
          </div>
          {isMenuOpen && (
            <div className={styles.mobileMenu}>
              <div className={styles.menuItems}>
              <ul className={styles.mobileMenuList}>
                <li>
                  <Link href="/" onClick={() => setMenuOpen(false)}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about-yali" onClick={() => setMenuOpen(false)}>
                    About Yali
                  </Link>
                  {/* <ul className={styles.mobileSubmenu}>
                    <li>
                      <Link href="/about-yali#team" onClick={() => setMenuOpen(false)}>
                        Team
                      </Link>
                    </li>
                  </ul> */}
                </li>
                <li>
                  <Link href="/newsroom" onClick={() => setMenuOpen(false)}>
                    Newsroom
                  </Link>
                </li>
                <li>
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>
                    Contact
                  </Link>
                </li>
              </ul>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className={styles.logoContainer}>
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <ul className={styles.menu}>
            <li className={styles.dropdown}>
              <Link href="/about-yali">About Yali</Link>
              <ul className={styles.dropdownMenu}>
                <li>
                  <Link href="/about-yali#team">Team</Link>
                </li>
              </ul>
            </li>
            <li>
              <Link href="/newsroom">Newsroom</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </>
      )}
    </nav>
  );
};

export default Navbar;