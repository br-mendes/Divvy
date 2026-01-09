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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <svg className="w-48 h-48 mb-6 text-gray-300" viewBox="0 0 200 200" fill="none">
        {/* Círculo de fundo */}
        <circle cx="100" cy="100" r="80" className="fill-gray-50" />
        
        {/* Carteira Vazia */}
        <rect x="60" y="70" width="80" height="60" rx="8" className="stroke-current stroke-2 fill-white" />
        <path d="M60 85 H140" className="stroke-current stroke-2" />
        
        {/* Mosca voando (animação sutil) */}
        <g className="animate-float">
            <path d="M150 60 Q160 50 170 60" className="stroke-primary stroke-2 fill-none" />
            <path d="M155 65 Q160 55 165 65" className="stroke-primary stroke-2 fill-none" />
            <circle cx="160" cy="60" r="2" className="fill-primary" />
        </g>
        
        {/* Sombra */}
        <ellipse cx="100" cy="145" rx="50" ry="5" className="fill-gray-200" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900">{message}</h3>
      <p className="text-gray-500 text-sm mt-1">
        {description}
      </p>
    </div>
  );
}