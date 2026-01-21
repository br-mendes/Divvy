'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

export default function ImageViewerModal({ isOpen, onClose, src, alt = 'Image' }: ImageViewerModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-50"
      >
        <X size={24} />
      </button>

      <div className="relative max-w-full max-h-full p-4 flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img 
            src={src} 
            alt={alt} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
        />
        
        <div className="flex gap-4 mt-4">
            <a 
                href={src} 
                download 
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                <Download size={16} /> Baixar
            </a>
            <a 
                href={src} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                <ExternalLink size={16} /> Abrir Original
            </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
