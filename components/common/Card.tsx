// components/common/Card.tsx

import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  icon,
  onClick,
  children,
  className = '',
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  );
};
