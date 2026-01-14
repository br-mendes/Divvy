// components/common/LogoAnimated.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LogoAnimated() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href="/"
      className="inline-flex items-center gap-2 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={`text-2xl transition-transform duration-300 ${
          isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
        }`}
      > 
         
      </span> 
      <span className="font-bold text-xl text-[#208085]">Divvy</span> 
    </Link> 
  ); 
} 
