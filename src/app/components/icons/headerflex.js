import React from 'react';
import styles from '../../styles/headerflex.module.css'; // don't change the name of this import
import { ViewfinderIcon } from './small icons/viewfinder icon.js';

const HeaderFlex = ({ 
  title, 
  color = 'white', 
  backgroundColor = 'transparent'
}) => {
  return (
    <header 
      className={styles.headerFlex} 
      style={{ backgroundColor, color }}
    >
      <ViewfinderIcon />
      <h1>{title}</h1>
      <ViewfinderIcon />
    </header>
  );
};

export default HeaderFlex;

