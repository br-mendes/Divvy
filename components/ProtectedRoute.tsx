'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!loading && !user) {
      const sp = searchParams?.toString();
      const current = `${pathname}${sp ? `?${sp}` : ''}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(current)}`);
    }
  }, [user, loading, router, pathname, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
