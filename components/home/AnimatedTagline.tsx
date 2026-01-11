
import React, { useState, useEffect } from 'react';

const taglines = [
  'organizadas em segundos',
  'simples e justas',
  'sem complicação',
  'sem climão',
  'sem dor de cabeça',
  'sem drama',
  'na palma da mão',
  'sem mal-entendidos',
];

export default function AnimatedTagline() {
  const [currentTagline, setCurrentTagline] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTagline((prev) => (prev + 1) % taglines.length);
        setIsTransitioning(false);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="block">
      Despesas em grupo{' '}
      <span
        className={`text-brand-600 dark:text-brand-400 block sm:inline transition-all duration-500 ${
          isTransitioning ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {taglines[currentTagline]}
      </span>
    </span>
  );
}
