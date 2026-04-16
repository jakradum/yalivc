'use client';

import styles from './dataroom.module.css';

const HamburgerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <line x1="10" y1="11.5" x2="30" y2="11.5" stroke="#FFFDEE" strokeWidth="1.5" />
    <line x1="10" y1="19.5" x2="30" y2="19.5" stroke="#FFFDEE" strokeWidth="1.5" />
    <line x1="10" y1="27.5" x2="30" y2="27.5" stroke="#FFFDEE" strokeWidth="1.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <line x1="12.6464" y1="26.7885" x2="26.7886" y2="12.6464" stroke="#FFFDEE" strokeWidth="1.5" />
    <line x1="13.3536" y1="12.6464" x2="27.4957" y2="26.7886" stroke="#FFFDEE" strokeWidth="1.5" />
  </svg>
);

export default function DataroomHamburger() {
  function toggle() {
    document.dispatchEvent(new CustomEvent('drToggleSidebar'));
  }

  return (
    <button className={styles.hamburger} onClick={toggle} aria-label="Toggle navigation">
      <span className={styles.hamburgerIconOpen}><HamburgerIcon /></span>
      <span className={styles.hamburgerIconClose}><CloseIcon /></span>
    </button>
  );
}
