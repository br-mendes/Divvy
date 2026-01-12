
import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Users, ChevronRight, CalendarClock, Lock } from 'lucide-react';

const typeConfig: Record<string, { emoji: string, label: string, color: string }> = {
  trip: { emoji: '✈️', label: 'Viagem', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  roommate: { emoji: '🏠', label: 'República', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  event: { emoji: '🎉', label: 'Evento', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
  general: { emoji: '💰', label: 'Geral', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
};

interface DivvyCardProps {
  divvy: Divvy;
  onRefresh?: () => void;
}

const DivvyCard: React.FC<DivvyCardProps> = ({ divvy }) => {
  const date = new Date(divvy.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const config = typeConfig[divvy.type] || typeConfig.general;

  return (
    <Link href={`/divvy/${divvy.id}`} className="block h-full group">
      <div className="relative h-full bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-3xl p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 hover:border-brand-200 dark:hover:border-brand-800 hover:-translate-y-1">
        
        {/* Type Badge & Date */}
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110 ${config.color}`}>
            {config.emoji}
          </div>
          
          <div className="flex flex-col items-end gap-2">
             {divvy.is_archived && (
               <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-dark-800 text-gray-500 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border border-gray-200 dark:border-dark-700 tracking-wider">
                 <Lock size={10} /> Arquivado
               </span>
             )}
             <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 dark:bg-dark-800 px-2 py-1 rounded-lg">
                <CalendarClock size={12} /> {date}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 mb-6">
          <div className="mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${config.color.replace('bg-', 'bg-opacity-20 ')}`}>
                  {config.label}
              </span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {divvy.name}
          </h3>
          
          {divvy.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {divvy.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-gray-100 dark:border-dark-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
               {/* Mock avatars visual based on count */}
               {[...Array(Math.min(3, divvy.member_count || 1))].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-dark-700 border-2 border-white dark:border-dark-900"></div>
               ))}
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
               {divvy.member_count || 1} {divvy.member_count === 1 ? 'Membro' : 'Membros'}
            </span>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-dark-800 flex items-center justify-center text-gray-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
             <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DivvyCard;
