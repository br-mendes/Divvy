import React, { useId } from 'react';

export default function DivvyLogo({ className = "w-12 h-12", animated = true }: { className?: string, animated?: boolean }) {
  const uniqueId = useId();
  const gradientId = `${uniqueId}-divvy-gradient`;
  const maskId = `${uniqueId}-divvy-mask`;
  const shadowId = `${uniqueId}-divvy-shadow`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} divvy-logo ${animated ? 'divvy-logo--animated' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b5bff" />
          <stop offset="100%" stopColor="#6c2bff" />
        </linearGradient>

        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <path
            d="M 50 50 L 50 2 A 48 48 0 0 0 2 50 Z"
            fill="black"
          />
        </mask>

        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="48"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
        mask={`url(#${maskId})`}
      />

      <g className="divvy-logo-slice">
        <path
          d="M 50 50 L 50 2 A 48 48 0 0 0 2 50 Z"
          fill="#b78cff"
        />
      </g>
    </svg>
  );
}
