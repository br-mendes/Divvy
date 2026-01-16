'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LogoAnimated() {
  const [hover, setHover] = useState(false);
  return (
    <Link href="/" 
      className="flex items-center gap-2 font-bold text-xl text-[#6366f1]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className={`text-2xl transition-transform duration-300 ${hover ? 'rotate-12 scale-110' : ''}`}>
        
      </span>
      Divvy
    </Link>
  );
}
