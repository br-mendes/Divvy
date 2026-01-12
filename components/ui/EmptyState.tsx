
import React from 'react';

interface EmptyStateProps {
  message?: string;
  description?: React.ReactNode;
}

export default function EmptyState({ 
  message = "Nada por aqui ainda!",
  description = "Toque no botão + para adicionar a primeira despesa."
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in-up">
      <div className="relative mb-10">
          <div className="absolute -inset-10 bg-brand-500/10 blur-[100px] rounded-full"></div>
          <svg className="w-56 h-56 text-dark-700 relative z-10" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" className="fill-dark-900/40" />
            <rect x="60" y="70" width="80" height="60" rx="16" className="stroke-dark-600 stroke-2 fill-dark-800" />
            <path d="M60 95 H140" className="stroke-dark-600 stroke-2 opacity-50" />
            
            <g className="animate-float">
                <circle cx="160" cy="60" r="4" className="fill-brand-500 shadow-glow" />
                <path d="M150 60 Q160 50 170 60" className="stroke-brand-500 stroke-2 fill-none opacity-40" />
            </g>
            
            <ellipse cx="100" cy="165" rx="60" ry="6" className="fill-dark-800/50" />
          </svg>
      </div>
      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{message}</h3>
      <p className="text-dark-500 text-lg max-w-sm mx-auto leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
