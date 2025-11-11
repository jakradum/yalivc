import React from 'react';
import styles from '../../styles/headerflex.module.css';
import { ViewfinderIcon } from './small icons/viewfinder icon.js';

const HeaderFlex = ({ 
  title, 
  color = 'inherit', 
  backgroundColor = 'transparent',
  desktopMaxWidth,
  mobileMaxWidth, // New prop for mobile max-width
  additionalBottomMargin = '0px',
  customHeight,
  mobileMinHeight
}) => {
  const wrapperClasses = `${styles.headerFlexWrapper} ${desktopMaxWidth ? styles.desktopMaxWidth : ''} ${mobileMaxWidth ? styles.mobileMaxWidth : ''}`;

  return (
    <div 
      className={wrapperClasses} 
      style={{ 
        '--desktop-max-width': desktopMaxWidth,
        '--mobile-max-width': mobileMaxWidth,
        '--mobile-min-height': mobileMinHeight,
        marginBottom: `calc(2rem + ${additionalBottomMargin})`
      }}
    >
      <header 
        className={styles.headerFlex}
        style={{
          '--color': color,
          '--background-color': backgroundColor,
          '--custom-height': customHeight || undefined
        }}
      >
        <ViewfinderIcon />
        <h1>{title}</h1>
        <ViewfinderIcon />
      </header>
    </div>
  );
};

export default HeaderFlex;