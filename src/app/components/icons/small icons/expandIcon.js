import React from 'react';
import styles from '../../../landing page styles/team.module.css';

export const ExpandIcon = ({ isExpanded }) => {
  return (
    <svg 
      className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7 10L12 15L17 10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};