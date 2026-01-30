import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DashboardDivvyRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/groups/${params.id}`);
}
