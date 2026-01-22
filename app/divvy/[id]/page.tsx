import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyDivvyRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/groups/${params.id}`);
}
