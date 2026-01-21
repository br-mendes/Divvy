import React from 'react';

export default function DivvyLogo({ className = "w-12 h-12", animated = true }: { className?: string, animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} text-primary ${animated ? 'animate-logo-float' : ''}`}
    >
      <defs>
        <linearGradient id="divvyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet-500 */}
          <stop offset="100%" stopColor="#6d28d9" /> {/* Violet-700 */}
        </linearGradient>
      </defs>
      
      {/* Main Group (The group) */}
      <path
        d="M50 50 L50 10 A40 40 0 1 1 10 50 Z"
        fill="url(#divvyGradient)"
        className="drop-shadow-sm"
      />
      
      {/* The Slice (The individual) - Animated */}
      <path
        d="M50 50 L10 50 A40 40 0 0 1 50 10 Z"
        fill="#a78bfa" /* Violet-400 */
        className={`${animated ? 'animate-slide-in' : ''} drop-shadow-md origin-center`}
        style={{ transformBox: 'fill-box' }}
      />
    </svg>
  );
}
