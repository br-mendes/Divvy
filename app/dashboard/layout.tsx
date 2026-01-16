'use client';

import { useAuth } from '@/hooks/useAuth';
import LogoAnimated from '@/components/common/LogoAnimated';
import Button from '@/components/common/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <LogoAnimated />
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
