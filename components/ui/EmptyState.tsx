
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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-8">
          <div className="absolute -inset-4 bg-brand-500/5 blur-3xl rounded-full"></div>
          <svg className="w-48 h-48 text-gray-200 dark:text-dark-700 relative z-10" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" className="fill-gray-50/50 dark:fill-dark-900/40" />
            <rect x="60" y="70" width="80" height="60" rx="12" className="stroke-current stroke-2 fill-white dark:fill-dark-800" />
            <path d="M60 90 H140" className="stroke-current stroke-2 opacity-50" />
            
            <g className="animate-float">
                <circle cx="160" cy="60" r="3" className="fill-brand-500" />
                <path d="M150 60 Q160 50 170 60" className="stroke-brand-500 stroke-2 fill-none opacity-40" />
            </g>
            
            <ellipse cx="100" cy="155" rx="50" ry="4" className="fill-gray-100 dark:fill-dark-800 opacity-50" />
          </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{message}</h3>
      <p className="text-gray-500 dark:text-dark-500 text-base max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
