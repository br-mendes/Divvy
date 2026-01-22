import GroupPageClient from '@/components/groups/GroupPageClient';

export const dynamic = 'force-dynamic';

export default function GroupPage({ params }: { params: { divvyId: string } }) {
  return <GroupPageClient divvyId={params.divvyId} />;
}
