
import React from 'react';
import Link from 'next/link';
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
    event: '🎉',
    general: '💰',
  };

  const typeLabel: Record<string, string> = {
    trip: 'Viagem',
    roommate: 'República',
    event: 'Evento',
    general: 'Geral',
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const [year, month, day] = dateStr.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:border-gray-600 transition flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-4xl">{typeEmoji[divvy.type] || '💰'}</span>
        {divvy.is_archived && (
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
            Arquivado
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-1">{divvy.name}</h3>
      <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-4">{typeLabel[divvy.type] || 'Geral'}</p>

      {divvy.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
          {divvy.description}
        </p>
      )}

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
        <span>👥 {divvy.member_count || divvy.members?.length || 1} membros</span>
        <span>📅 {formatDate(divvy.created_at)}</span>
      </div>

      <Link href={`/divvy/${divvy.id}`} className="block w-full">
        <Button variant="outline" fullWidth>
          Ver detalhes
        </Button>
      </Link>
    </div>
  );
};

export default DivvyCard;
