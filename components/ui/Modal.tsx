
"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className={`
        relative w-full ${sizeClasses[size]} bg-white dark:bg-dark-800 rounded-[28px] sm:rounded-3xl shadow-2xl overflow-hidden
        border border-gray-100 dark:border-dark-700 transition-all transform animate-fade-in-up
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 ${title ? 'border-b border-gray-50 dark:border-dark-700' : 'pb-0'}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
