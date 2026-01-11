
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
      }, 300);
    }, 4000); // Muda a cada 4 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      Despesas em grupo
      <span
        className={`text-primary block transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {taglines[currentTagline]}
      </span>
    </>
  );
}
