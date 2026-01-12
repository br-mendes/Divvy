
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

interface DivvyCardProps {
  divvy: Divvy;
  onRefresh?: () => void;
}

const DivvyCard: React.FC<DivvyCardProps> = ({ divvy }) => {
  const date = new Date(divvy.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="group relative bg-white dark:bg-dark-900 rounded-[2rem] p-7 border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-2xl hover:border-brand-200 dark:hover:border-brand-900/40 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-500/10 transition-colors"></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        {divvy.is_archived && (
          <span className="bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-dark-500 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full border border-gray-200 dark:border-dark-700">
            Arquivado
          </span>
        )}
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {divvy.name}
        </h3>
        <p className="text-xs font-black text-brand-600 dark:text-brand-500 uppercase tracking-widest mb-4">
          {typeLabel[divvy.type]}
        </p>
        
        {divvy.description && (
          <p className="text-sm text-gray-500 dark:text-dark-500 line-clamp-2 mb-6 leading-relaxed">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-5 pt-5 border-t border-gray-50 dark:border-dark-700/50 mt-auto relative z-10">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-600">
          <span className="flex items-center gap-2"><Users size={14} className="text-brand-500" /> {divvy.member_count || 1} membros</span>
          <span className="flex items-center gap-2"><Calendar size={14} className="text-brand-500" /> {date}</span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-white rounded-2xl h-12 font-bold transition-all active:scale-[0.98]">
            Acessar Grupo
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DivvyCard;
