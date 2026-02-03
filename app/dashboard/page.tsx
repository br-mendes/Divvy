import DashboardClient from './DashboardClient';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardClient />
    </ProtectedRoute>
  );
}
