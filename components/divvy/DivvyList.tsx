import React from 'react';
import { Divvy } from '../../types';
import DivvyCard from './DivvyCard';

interface DivvyListProps {
  divvies: Divvy[];
  onRefresh?: () => void;
}

export default function DivvyList({ divvies, onRefresh }: DivvyListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {divvies.map((divvy) => (
        <DivvyCard key={divvy.id} divvy={divvy} onRefresh={onRefresh} />
      ))}
    </div>
  );
}