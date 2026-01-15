import React from 'react';
import DivvyLogo from '../branding/DivvyLogo';

type LogoSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<LogoSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export function Logo({ size = 'md', animated = true }: { size?: LogoSize; animated?: boolean }) {
  return <DivvyLogo className={sizeClasses[size]} animated={animated} />;
}
