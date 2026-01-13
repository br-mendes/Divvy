
"use client";

import React, { useState, useEffect } from 'react';

const taglines = [
  'para colegas de quarto',
  'para suas viagens',
  'para grupos e eventos',
  'de forma inteligente',
  'com total clareza',
  'simples e organizada',
  'onde quer que você esteja',
  'com quem você divide a vida',
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
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="block">
      Divida despesas{' '}
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
