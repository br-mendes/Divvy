'use client';

import { useEffect, useState } from 'react';
import InviteModal from '@/components/invite/InviteModal';

type GroupResponse = {
  name?: string | null;
};

export function InvitesPanel({ divvyId }: { divvyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState('grupo');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/groups/${divvyId}`);
        const data: GroupResponse = await res.json();
        if (isMounted && res.ok) {
          setGroupName(data.name ?? 'grupo');
        }
      } catch (error) {
        if (isMounted) {
          setGroupName('grupo');
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [divvyId]);

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Convites</h2>
        <button className="border rounded px-3 py-1" onClick={() => setIsOpen(true)}>
          Convidar
        </button>
      </div>

      <p className="text-sm opacity-70">
        Envie convites para novos membros participarem deste grupo.
      </p>

      <InviteModal divvyId={divvyId} divvyName={groupName} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}