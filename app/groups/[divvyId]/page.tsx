import { MembersPanel } from '@/components/groups/MembersPanel';
import { RemovalRequestsPanel } from '@/components/groups/RemovalRequestsPanel';
import { InvitesPanel } from '@/components/groups/InvitesPanel';

type GroupPageProps = {
  params: { divvyId: string };
};

export default function GroupPage({ params }: GroupPageProps) {
  const { divvyId } = params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <MembersPanel divvyId={divvyId} />
      <InvitesPanel divvyId={divvyId} />
      <RemovalRequestsPanel divvyId={divvyId} />
    </div>
  );
}
