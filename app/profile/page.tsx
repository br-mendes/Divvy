import { Suspense } from 'react';
import ProfileClient from './profile-client';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Carregando perfil…</div>}>
      <ProfileClient />
    </Suspense>
  );
}
