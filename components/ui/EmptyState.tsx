
import React from 'react';

interface EmptyStateProps {
  message?: string;
  description?: React.ReactNode;
}

export default function EmptyState({ 
  message = "Nada por aqui ainda!",
  description = "Toque no botão 'Novo Grupo' para começar a dividir gastos."
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in-up">
      <div className="relative mb-8">
          <div className="absolute -inset-10 bg-brand-500/5 blur-[80px] rounded-full"></div>
          <svg className="w-48 h-48 text-gray-200 dark:text-dark-800 relative z-10" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" className="fill-gray-50 dark:fill-dark-900/50" />
            <rect x="65" y="75" width="70" height="50" rx="12" className="stroke-gray-300 dark:stroke-dark-700 stroke-2 fill-white dark:fill-dark-800" />
            <path d="M65 95 H135" className="stroke-gray-200 dark:stroke-dark-700 stroke-2" />
            
            <g className="animate-pulse">
                <circle cx="150" cy="70" r="3" className="fill-brand-400" />
            </g>
          </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{message}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-base max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
