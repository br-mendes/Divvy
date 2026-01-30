'use client';

import React, { useEffect, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="border rounded p-0 w-[min(520px,92vw)]"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="p-4 space-y-2">
        <div className="font-semibold text-base">{title}</div>
        {description && <div className="text-sm opacity-80">{description}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button className="border rounded px-3 py-2" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="border rounded px-3 py-2"
            type="button"
            onClick={onConfirm}
            aria-label={confirmText}
            title={confirmText}
          >
            {danger ? ` ${confirmText}` : confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
