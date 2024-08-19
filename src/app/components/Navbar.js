'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Navbar.module.css';
import { Logo } from './icons/logo';
import { Lightlogo } from './icons/lightlogo';
import { PinkLogo } from './icons/pinklogo';
import { CloseIcon } from './icons/closeicon';
import { Openicon } from './icons/Openicon';

// JSON object for menu items
const menuItems = [
  { name: 'Home', path: '/' },
  {
    name: 'About Yali',
    path: '/about-yali',
    subItems: [{ name: 'Team', path: '/about-yali#team' }],
  },
  { name: 'Investments', path: '/investments' },
  { name: 'Newsroom', path: '/newsroom' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 800);
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

  const renderMobileMenu = () => (
    <ul className={styles.mobileMenuList}>
      {menuItems.map((item, index) => (
      <li key={index}>
        <Link href={item.path} onClick={() => setMenuOpen(false)} className={styles.mobileMenuLink}>
          <span>{item.name.toUpperCase()}</span>
        </Link>
          {/* Team commented out for mobile */}
          {/*
          {item.subItems && (
            <ul className={styles.mobileSubmenu}>
              {item.subItems.map((subItem, subIndex) => (
                <li key={`${index}-${subIndex}`}>
                  <Link href={subItem.path} onClick={() => setMenuOpen(false)}>
                    {subItem.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          */}
        </li>
      ))}
    </ul>
  );

  const renderDesktopMenu = () => (
    <ul className={styles.menu}>
      {menuItems.map((item, index) => (
        <li key={index} className={item.subItems ? styles.dropdown : ''}>
          <Link href={item.path}>{item.name.toUpperCase()}</Link>
          {item.subItems && (
            <ul className={styles.dropdownMenu}>
              {item.subItems.map((subItem, subIndex) => (
                <li key={`${index}-${subIndex}`}>
                  <Link href={subItem.path}>{subItem.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      className={`${styles.navbar} ${isSticky ? styles.sticky : ''} ${isMobile && isMenuOpen ? styles.expanded : ''}`}
    >
      {isMobile ? (
        <>
          <div className={isMenuOpen ? styles.mobileNavContentOpen : styles.mobileNavContent}>
            <div className={styles.mobileLogo}>
              <Link href="/" onClick={() => setMenuOpen(false)}>
                {isMenuOpen ? <Logo /> : <Lightlogo />}
              </Link>
            </div>
            <button className={styles.menuToggle} onClick={toggleMenu}>
              {isMenuOpen ? <CloseIcon/> : <Openicon/>}
            </button>
          </div>
          {isMenuOpen && (
            <div className={styles.mobileMenu}>
              <div className={styles.menuItems}>{renderMobileMenu()}</div>
              <div className={styles.mobileMenuBottom}>
                <p className={styles.verticalText}>Yali.VC</p>
                <PinkLogo className={`${styles.pinkLogo} global-pinklogo`} />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Desktop section below */}
          <div className={styles.logoContainer}>
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {renderDesktopMenu()}
        </>
      )}
    </nav>
  );
};

export default Navbar;
