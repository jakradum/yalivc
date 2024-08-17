'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Navbar.module.css';
import { Logo } from './logo';
import { Lightlogo } from './lightlogo';

const Navbar = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handlePageOpen = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isSticky ? styles.sticky : ''}`}>
        {isMobile ? (
          <div className={styles.mobileNavContent}>
            <div className={styles.mobileLogo}>
              <Link href="/">
                <Lightlogo />
              </Link>
            </div>
            <button className={styles.menuToggle} onClick={toggleSidebar}>
              ☰
            </button>
          </div>
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
      
      {isMobile && (
        <aside ref={sidebarRef} className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
          <button className={styles.closeButton} onClick={toggleSidebar}>
            &times;
          </button>
          <ul className={styles.sidebarMenu}>
            <li>
              <Link onClick={handlePageOpen} href="/">
                Home
              </Link>
            </li>
            <li>
              <Link onClick={handlePageOpen} href="/about-yali">
                About Yali
              </Link>
              <ul className={styles.sidebarDropdownMenu}>
                <li>
                  <Link onClick={handlePageOpen} href="/about-yali#team">
                    Team
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link onClick={handlePageOpen} href="/newsroom">
                Newsroom
              </Link>
            </li>
            <li>
              <Link onClick={handlePageOpen} href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </aside>
      )}
    </>
  );
};

export default Navbar;
