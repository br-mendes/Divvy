
import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-20 h-20">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-brand-500/10 rounded-full"></div>
        {/* Spinning Ring */}
        <div className="absolute inset-0 border-4 border-t-brand-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        {/* Inner Pulsing Circle */}
        <div className="absolute inset-4 bg-brand-500/20 rounded-full animate-pulse"></div>
        {/* Center Glow */}
        <div className="absolute inset-7 bg-brand-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.8)]"></div>
      </div>
    </div>
  );
}
