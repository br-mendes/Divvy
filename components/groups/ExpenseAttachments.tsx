'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Attachment = {
  id: string;
  bucket: string;
  path: string;
  filename: string | null;
  mimetype: string | null;
  sizebytes: number | null;
  createdat: string;
};

export function ExpenseAttachments({
  divvyId,
  expenseId,
}: {
  divvyId: string;
  expenseId: string;
}) {
  const supabase = createClientComponentClient();
  const [items, setItems] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch(`/api/groups/${divvyId}/expenses/${expenseId}/attachments`);
    const data = await res.json();
    if (res.ok) {
      setItems(data.attachments ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, [divvyId, expenseId]);

  async function upload(file: File) {
    setUploading(true);

    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `divvy/${divvyId}/expense/${expenseId}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from('receipts')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setUploading(false);
      alert(upErr.message);
      return;
    }

    const metaRes = await fetch(`/api/groups/${divvyId}/expenses/${expenseId}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'receipts',
        path,
        filename: file.name,
        mimetype: file.type,
        sizebytes: file.size,
      }),
    });

    const meta = await metaRes.json();
    if (!metaRes.ok) {
      setUploading(false);
      alert(meta.error ?? 'Erro ao salvar metadata do anexo');
      return;
    }

    setUploading(false);
    await load();
  }

  async function download(attId: string) {
    const res = await fetch(
      `/api/groups/${divvyId}/expenses/${expenseId}/attachments/${attId}/download`
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? 'Erro ao gerar link');
      return;
    }

    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function remove(attId: string) {
    const ok = window.confirm('Excluir este anexo?');
    if (!ok) return;

    const res = await fetch(
      `/api/groups/${divvyId}/expenses/${expenseId}/attachments/${attId}`,
      {
        method: 'DELETE',
      }
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? 'Erro ao excluir');
      return;
    }

    await load();
  }

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Comprovantes</div>
        <button className="border rounded px-3 py-1" onClick={load}>
          Recarregar
        </button>
      </div>

      <input
        type="file"
        accept="image/*,application/pdf"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.currentTarget.value = '';
        }}
      />

      {uploading && <div className="text-sm opacity-70">Enviando...</div>}

      {items.length === 0 ? (
        <div className="text-sm opacity-70">Nenhum anexo.</div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="border rounded p-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm truncate">{a.filename ?? a.path}</div>
                <div className="text-xs opacity-70">
                  {a.mimetype ?? 'arquivo'}{' '}
                  {a.sizebytes ? `• ${Math.round(a.sizebytes / 1024)} KB` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="border rounded px-3 py-1" onClick={() => download(a.id)}>
                  Abrir
                </button>
                <button className="border rounded px-3 py-1" onClick={() => remove(a.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
