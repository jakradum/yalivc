'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {Logo} from './icons/logo.js'
import {Lightlogo} from './icons/lightlogo';
import {Openicon} from './icons/small icons/Openicon';
import {CloseIcon} from './icons/small icons/closeicon';
import {PinkLogo} from './icons/pinklogo';
import styles from '../styles/Navbar.module.css';
import navigationItems from '../navigationItems.json';

const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [availableSectors, setAvailableSectors] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 950;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/sectors-with-companies')
      .then(res => res.json())
      .then(data => setAvailableSectors(data.slugs))
      .catch(err => console.error('Failed to load sectors:', err));
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setIsSticky(true);
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsSticky(false);
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile]);

  useEffect(() => {
    const handleRouteChange = () => {
      setMenuOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isMobile]);

  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const filterSectorItems = (items) => {
    return items.map(item => {
      if (item.path === '/investments' && item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter(subItem => 
            subItem.path === '/investments/sectors' ||
            availableSectors.some(slug => subItem.path.includes(slug))
          )
        };
      }
      return item;
    });
  };

  const renderMobileMenu = () => (
    <ul className={styles.mobileMenuList}>
      {filterSectorItems(navigationItems.menuItems).map((item, index) => (
        <li key={index}>
          <Link href={item.path} onClick={() => setMenuOpen(false)} className={styles.mobileMenuLink}>
            <span>{item.name.toUpperCase()}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderDesktopMenu = () => (
    <ul className={styles.menu}>
      {filterSectorItems(navigationItems.menuItems).map((item, index) => (
        <li key={index} className={item.subItems ? styles.dropdown : ''}>
          <Link 
            href={item.path}
            className={isActive(item.path) ? styles.active : ''}
          >
            {item.name.toUpperCase()}
          </Link>
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
      className={`${styles.navbar} 
                  ${isSticky ? styles.sticky : ''} 
                  ${isMobile && isMenuOpen ? styles.expanded : ''} 
                  ${!isMobile && !isVisible ? styles.hidden : ''}`}
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
              {renderMobileMenu()}
              <div className={styles.mobileMenuBottom}>
                <p className={styles.verticalText}>Yali.VC</p>
                <PinkLogo className={`${styles.pinkLogo} global-pinklogo`} />
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
          {renderDesktopMenu()}
        </>
      )}
    </nav>
  );
};

export default Navbar;