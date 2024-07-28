"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Navbar.module.css'

const Navbar = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

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

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isSticky ? styles.sticky : ''}`}>
        {isMobile && (
          <button className={styles.menuToggle} onClick={toggleSidebar}>
            ☰
          </button>
        )}
        {!isMobile && (
          <ul className={styles.menu}>
            <li><Link href="/">Home</Link></li>
            <li className={styles.dropdown}>
              <Link href="/about-yali">About Yali</Link>
              <ul className={styles.dropdownMenu}>
                <li><Link href="/about-yali#team">Team</Link></li>
              </ul>
            </li>
            <li><Link href="/newsroom">Newsroom</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        )}
      </nav>
      {isMobile && isSidebarOpen && (
        <aside className={styles.sidebar}>
          <button className={styles.closeButton} onClick={toggleSidebar}>
            &times;
          </button>
          <ul className={styles.sidebarMenu}>
            <li><Link href="/">Home</Link></li>
            <li>
              <Link href="/about-yali">About Yali</Link>
              <ul className={styles.sidebarDropdownMenu}>
                <li><Link href="/about-yali#team">Team</Link></li>
              </ul>
            </li>
            <li><Link href="/newsroom">Newsroom</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </aside>
      )}
    </>
  );
};

export default Navbar;