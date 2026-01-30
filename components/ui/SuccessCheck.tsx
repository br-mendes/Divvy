import React from 'react';

export default function SuccessCheck() {
  return (
    <div className="w-24 h-24 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Círculo que se desenha */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-green-500 stroke-[5] fill-none animate-draw-circle origin-center -rotate-90"
          strokeLinecap="round"
        />
        
        {/* Checkmark que aparece */}
        <path
          d="M30 50 L45 65 L70 35"
          className="stroke-green-500 stroke-[5] fill-none animate-draw-check"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
      </svg>
    </div>
  );
}