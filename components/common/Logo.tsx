// components/common/Logo.tsx

import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true }) => {
  const sizeClass = styles[size];
  const animatedClass = animated ? styles.animated : '';

  return (
    <div className={`${styles.logo} ${sizeClass} ${animatedClass}`}>
      <div className={styles.icon}></div> 
      <span className={styles.text}>Divvy</span>
    </div>
  );
};
