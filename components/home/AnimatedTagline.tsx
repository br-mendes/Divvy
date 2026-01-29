'use client';

import * as React from 'react';

const taglines = [
  'organizadas em segundos',
  'simples e justas',
  'sem complicacao',
  'sem climao',
  'sem dor de cabeca',
  'sem drama',
  'na palma da mao',
  'sem mal-entendidos',
];

export default function AnimatedTagline() {
  const [currentTagline, setCurrentTagline] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      window.setTimeout(() => {
        setCurrentTagline((prev) => (prev + 1) % taglines.length);
        setIsTransitioning(false);
      }, 350);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="block">
      Despesas em grupo
      <span
        className={[
          'text-brand-600 block transition-opacity duration-300',
          isTransitioning ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
        aria-live="polite"
      >
        {taglines[currentTagline]}
      </span>
    </span>
  );
}
