'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LogoAnimated() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-bold text-xl text-indigo-600"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={`text-2xl transition-transform duration-300 ${
          isHovered ? 'rotate-12 scale-110' : 'scale-100 rotate-0'
        }`}
      >
        ✨
      </span>
      <span>Divvy</span>
    </Link>
  );
}
