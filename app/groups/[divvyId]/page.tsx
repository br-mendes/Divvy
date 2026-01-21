'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GroupTabs } from '@/components/groups/GroupTabs';
import { PeriodPicker } from '@/components/groups/PeriodPicker';

type MemberRow = {
  id: string;
};

export default function GroupPage() {
  const params = useParams();
  const divvyId = typeof params?.divvyId === 'string' ? params.divvyId : '';
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    if (!divvyId) return;

    async function loadMembers() {
      const { data } = await supabase
        .from('divvymembers')
        .select('id')
        .eq('divvyid', divvyId);

      setMembers(data ?? []);
    }

    loadMembers();
  }, [divvyId]);

  return (
    <div className="space-y-6">
      <PeriodPicker />
      <GroupTabs divvyId={divvyId} membersCount={members.length} />
    </div>
  );
}
