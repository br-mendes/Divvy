
import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, Users, ArrowUpRight } from 'lucide-react';

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
    <div className="group relative bg-white dark:bg-dark-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-2xl hover:border-brand-200/50 dark:hover:border-brand-500/30 transition-all duration-500 flex flex-col h-full overflow-hidden">
      
      {/* Glow effect on hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="w-16 h-16 rounded-[1.25rem] bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        <div className="flex flex-col items-end gap-2">
            {divvy.is_archived && (
              <span className="bg-gray-100 dark:bg-dark-900 text-gray-500 dark:text-dark-500 text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full border border-gray-200 dark:border-dark-700">
                Arquivado
              </span>
            )}
            <div className="hidden group-hover:flex text-brand-600 dark:text-brand-400 animate-pulse">
                <ArrowUpRight size={20} />
            </div>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {divvy.name}
        </h3>
        <p className="text-xs font-black text-brand-600 dark:text-brand-500 uppercase tracking-[0.2em] mb-6">
          {typeLabel[divvy.type]}
        </p>
        
        {divvy.description && (
          <p className="text-sm text-gray-500 dark:text-dark-500 line-clamp-2 mb-8 leading-relaxed font-medium">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-6 pt-6 border-t border-gray-50 dark:border-dark-700/50 mt-auto relative z-10">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-dark-600">
          <span className="flex items-center gap-2 bg-gray-50 dark:bg-dark-900 px-3 py-1.5 rounded-full border border-gray-100 dark:border-dark-700">
            <Users size={14} className="text-brand-500" /> {divvy.member_count || 1} MEMBROS
          </span>
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-brand-500" /> {date}
          </span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="dark:bg-dark-900 dark:hover:bg-dark-700 dark:text-white rounded-2xl h-14 font-extrabold text-sm uppercase tracking-widest transition-all active:scale-[0.97] border border-transparent dark:border-dark-700">
            Acessar Painel
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DivvyCard;
