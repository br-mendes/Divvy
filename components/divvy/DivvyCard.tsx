
import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, Users } from 'lucide-react';

const typeEmoji: Record<string, string> = {
  trip: '✈️', roommate: '🏠', event: '🎉', general: '💰',
};

const typeLabel: Record<string, string> = {
  trip: 'Viagem', roommate: 'República', event: 'Evento', general: 'Geral',
};

// Fix: Included onRefresh in the props type definition to match the props passed from DivvyList.tsx
export default function DivvyCard({ divvy, onRefresh }: { divvy: Divvy; onRefresh?: () => void }) {
  const date = new Date(divvy.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="group relative bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-900/50 transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        {divvy.is_archived && (
          <span className="bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
            Arquivado
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {divvy.name}
        </h3>
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-3">
          {typeLabel[divvy.type]}
        </p>
        
        {divvy.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-dark-700 mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><Users size={14} /> {divvy.member_count || 1} membros</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {date}</span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="dark:bg-dark-700 dark:hover:bg-dark-600">
            Acessar Grupo
          </Button>
        </Link>
      </div>
    </div>
  );
}
