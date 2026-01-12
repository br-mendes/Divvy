
import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, Users, ChevronRight, ArrowUpRight } from 'lucide-react';

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
    <div className="group relative bg-[#0A0A0B] border border-dark-700/60 rounded-[2.5rem] p-8 flex flex-col h-full transition-all duration-500 hover:border-brand-500/50 hover:bg-[#0F0F11] shadow-2xl hover:shadow-brand-500/10 overflow-hidden">
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>

      <div className="flex justify-between items-start mb-12 relative z-10">
        <div className="w-20 h-20 rounded-[1.5rem] bg-dark-900 border border-dark-700 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          {typeEmoji[divvy.type] || '💰'}
        </div>
        <div className="flex flex-col items-end gap-3">
            {divvy.is_archived && (
              <span className="bg-dark-800 text-dark-400 text-[9px] uppercase font-black tracking-widest px-4 py-2 rounded-full border border-dark-700">
                Arquivado
              </span>
            )}
            <div className="w-10 h-10 rounded-full border border-dark-700 flex items-center justify-center text-dark-500 group-hover:text-brand-400 group-hover:border-brand-500/50 transition-all">
                <ArrowUpRight size={20} />
            </div>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.25em]">
                {typeLabel[divvy.type]}
            </span>
            <div className="h-1 w-1 bg-dark-700 rounded-full"></div>
            <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">
                {date}
            </span>
        </div>
        
        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter leading-none group-hover:text-brand-400 transition-colors">
          {divvy.name}
        </h3>
        
        {divvy.description && (
          <p className="text-sm text-dark-400 line-clamp-2 mb-8 leading-relaxed font-medium">
            {divvy.description}
          </p>
        )}
      </div>

      <div className="space-y-6 pt-8 border-t border-dark-800/50 mt-auto relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-dark-800 flex items-center justify-center text-[10px] font-bold text-dark-400">
                    {i === 3 ? `+${(divvy.member_count || 1) - 2}` : ''}
                </div>
             ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-dark-500">
            {divvy.member_count || 1} Participantes
          </span>
        </div>
        
        <Link href={`/divvy/${divvy.id}`} className="block">
          <Button variant="secondary" fullWidth className="bg-dark-900 hover:bg-brand-600 border border-dark-700 hover:border-brand-500 text-white rounded-[1.25rem] h-16 font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]">
            Entrar no Grupo <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DivvyCard;
