import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg className="w-16 h-16" viewBox="0 0 100 100">
        {/* Círculo externo pulsante */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="4"
          className="text-primary/20 animate-ping-slow fill-none"
        />
        
        {/* Moedas centrais */}
        <circle cx="35" cy="50" r="10" className="text-primary animate-bounce-delay-1 fill-current" />
        <circle cx="65" cy="50" r="10" className="text-primary animate-bounce-delay-2 fill-current" />
        <circle cx="50" cy="30" r="10" className="text-primary animate-bounce-delay-3 fill-current" />
      </svg>
      <span className="text-sm font-medium text-gray-500 animate-pulse">
        Calculando divisão...
      </span>
    </div>
  );
}