import React from 'react';
import DivvyLogo from '../branding/DivvyLogo';
import styles from './Logo.module.css';

type LogoSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<LogoSize, string> = {
  sm: (styles as any).sm ?? '',
  md: (styles as any).md ?? '',
  lg: (styles as any).lg ?? '',
};

function LogoImpl({
  size = 'md',
  animated = true,
  className = '',
}: {
  size?: LogoSize;
  animated?: boolean;
  className?: string;
}) {
  const wrapper = (styles as any).logoWrapper ?? '';
  const animatedClass = animated ? ((styles as any).animated ?? '') : '';
  const text = (styles as any).text ?? '';

  return (
    <div className={[wrapper, sizeClass[size], animatedClass, className].filter(Boolean).join(' ')}>
      <DivvyLogo animated={animated} />
      <span className={text}>Divvy</span>
    </div>
  );
}

export const Logo = LogoImpl;
export default LogoImpl;
