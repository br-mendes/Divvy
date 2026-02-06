import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  // Protecao agora e 100% pelo middleware (server).
  return <DashboardClient />;
}
