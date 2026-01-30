import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}