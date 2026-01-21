'use client';

import React from 'react';

type NoticeType = 'success' | 'error' | 'info';

export function Notice({
  type,
  message,
  onClose,
}: {
  type: NoticeType;
  message: string;
  onClose?: () => void;
}) {
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div
      className="border rounded p-3 text-sm flex items-start justify-between gap-3"
      role={role as any}
      aria-live="polite"
    >
      <div className="min-w-0">
        <div className="font-semibold">
          {type === 'success' ? 'Tudo certo' : type === 'error' ? 'Atenção' : 'Info'}
        </div>
        <div className="opacity-80 break-words">{message}</div>
      </div>

      {onClose && (
        <button
          className="border rounded px-2 py-1 text-xs shrink-0"
          onClick={onClose}
          type="button"
          aria-label="Fechar aviso"
        >
          ok
        </button>
      )}
    </div>
  );
}
