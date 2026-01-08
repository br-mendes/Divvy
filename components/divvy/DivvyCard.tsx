import React from 'react';
import { Link } from 'react-router-dom';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';

export interface DivvyCardProps {
  divvy: Divvy;
  onRefresh?: () => void;
}

const DivvyCard: React.FC<DivvyCardProps> = ({ divvy, onRefresh }) => {
  const typeEmoji: Record<string, string> = {
    trip: '✈️',
    roommate: '🏠',
    couple: '💜',
    event: '🎉',
    other: '💰',
  };

  const typeLabel: Record<string, string> = {
    trip: 'Viagem',
    roommate: 'República',
    couple: 'Casal',
    event: 'Evento',
    other: 'Outro',
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl">{typeEmoji[divvy.type] || '💰'}</span>
        {divvy.is_archived && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
            Arquivado
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mt-2 mb-1">{divvy.name}</h3>
      <p className="text-sm text-brand-600 font-medium mb-4">{typeLabel[divvy.type] || 'Outro'}</p>

      {divvy.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {divvy.description}
        </p>
      )}

      <div className="flex gap-4 text-sm text-gray-500 mb-4 border-t border-gray-200 pt-4 mt-auto">
        <span>👥 {divvy.members?.length || 1} membros</span>
        <span>📅 {new Date(divvy.created_at).toLocaleDateString('pt-BR')}</span>
      </div>

      <Link to={`/divvy/${divvy.id}`} className="block w-full">
        <Button variant="outline" fullWidth>
          Ver detalhes
        </Button>
      </Link>
    </div>
  );
};

export default DivvyCard;