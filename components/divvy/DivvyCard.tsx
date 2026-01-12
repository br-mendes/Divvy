
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
    <div className="group relative bg-dark-900 border border-dark-700 rounded-[2rem] p-8 flex flex-col h-full transition-all duration-500 hover:border-brand-500/50 hover:bg-dark-800 shadow-sm hover:shadow-[0_20px_50px_rgba(139,92,246,0.1)] overflow-hidden">
      
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-brand-500/15 transition-colors duration-700"></div>

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        {divvy.is_archived && (
          <span className="bg-dark-700 text-dark-400 text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full border border-dark-600">
            Arquivado
          </span>
        )}
      </div>

      <div className="flex-1 relative z-10">
        <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em]">
                {typeLabel[divvy.type]}
            </span>
            <div className="h-1 w-1 bg-dark-600 rounded-full"></div>
            <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">
                {date}
            </span>
        </div>
        
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-brand-400 transition-colors">
          {divvy.name}
        </h3>
        
        {divvy.description && (
          <p className="text-sm text-dark-400 line-clamp-2 mb-8 leading-relaxed font-medium">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-6 pt-6 border-t border-dark-700 mt-auto relative z-10">
        <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-dark-500">
          <span className="flex items-center gap-2 bg-dark-950 px-3 py-1.5 rounded-lg border border-dark-700">
            <Users size={14} className="text-brand-500" /> {divvy.member_count || 1} Participantes
          </span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="bg-dark-800 hover:bg-brand-600 border border-dark-700 hover:border-brand-500 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] group-hover:shadow-lg group-hover:shadow-brand-500/10">
            Acessar Grupo <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DivvyCard;
