import React from 'react';
import styles from '../../styles/menuIcon.module.css';

export const AnimatedMenuIcon = ({ isOpen }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="11.5" x2="30" y2="11.5" stroke="#FFFDEE" className={`${styles.line} ${styles.line1} ${isOpen ? styles.open : ''}`}/>
      <line x1="10" y1="19.5" x2="30" y2="19.5" stroke="#FFFDEE" className={`${styles.line} ${styles.line2} ${isOpen ? styles.open : ''}`}/>
      <line x1="10" y1="27.5" x2="30" y2="27.5" stroke="#FFFDEE" className={`${styles.line} ${styles.line3} ${isOpen ? styles.open : ''}`}/>
    </svg>
  );
};