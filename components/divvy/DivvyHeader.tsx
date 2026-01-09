import React from 'react';
import Link from 'next/link';
import { Divvy } from '../../types';
import { Button } from '../ui/Button';

interface DivvyHeaderProps {
  divvy: Divvy;
}

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

export default function DivvyHeader({ divvy }: DivvyHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-8">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{typeEmoji[divvy.type] || '💰'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{divvy.name}</h1>
              <div className="text-sm text-gray-500">
                {typeLabel[divvy.type]} •{' '}
                {new Date(divvy.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <Link href="/dashboard">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        {divvy.description && (
          <p className="text-gray-600 mt-2 max-w-2xl">{divvy.description}</p>
        )}
      </div>
    </div>
  );
}