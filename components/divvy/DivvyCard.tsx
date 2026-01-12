
import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, Users, ChevronRight } from 'lucide-react';

const typeEmoji: Record<string, string> = {
  trip: '✈️', roommate: '🏠', event: '🎉', general: '💰',
};

const typeLabel: Record<string, string> = {
  trip: 'Viagem', roommate: 'República', event: 'Evento', general: 'Geral',
};

interface DivvyCardProps {
  divvy: Divvy;
  onRefresh?: () => void;
}

const DivvyCard: React.FC<DivvyCardProps> = ({ divvy }) => {
  const date = new Date(divvy.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="group bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl p-6 flex flex-col h-full transition-all hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-800">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-dark-800 flex items-center justify-center text-2xl shadow-inner border border-gray-100 dark:border-dark-700">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        {divvy.is_archived && (
          <span className="bg-gray-100 dark:bg-dark-800 text-gray-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-gray-200 dark:border-dark-700">
            Arquivado
          </span>
        )}
      </div>

      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {typeLabel[divvy.type]}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                • {date}
            </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {divvy.name}
        </h3>
        
        {divvy.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 leading-relaxed">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-5 pt-5 border-t border-gray-100 dark:border-dark-800 mt-auto">
        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-brand-500" /> {divvy.member_count || 1} Participantes
          </span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="bg-gray-100 dark:bg-dark-800 hover:bg-brand-600 hover:text-white text-gray-900 dark:text-white rounded-xl h-11 font-bold text-xs uppercase tracking-wider transition-all border-none">
            Acessar Grupo <ChevronRight size={16} className="ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DivvyCard;
