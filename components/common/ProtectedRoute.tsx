'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

function ProtectedRouteContent({ children, fallback = '/auth/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const finish = (ok: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setAuthenticated(ok);
      setLoading(false);
    };

    // Subscribe immediately to avoid missing racey SIGNED_IN.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_OUT' || !session) {
        finish(false);
        router.replace(fallback);
        return;
      }

      // SIGNED_IN / INITIAL_SESSION with a session.
      finish(true);
    });

    const checkAuth = async () => {
      try {
        const r: any = await supabase.auth.getSession();
        const session = r?.data?.session;

        if (session) {
          finish(true);
          return;
        }

        // Give the client a moment to hydrate/persist session after OAuth.
        const timeoutId = setTimeout(() => {
          if (!finishedRef.current) {
            finish(false);
            router.replace(fallback);
          }
        }, 2000);

        return () => clearTimeout(timeoutId);
      } catch (e) {
        console.error('Auth check exception:', e);
        finish(false);
        router.replace(fallback);
      }
    };

    let cleanupCheck: undefined | (() => void);
    checkAuth().then((c: any) => {
      if (typeof c === 'function') cleanupCheck = c;
    });

    return () => {
      subscription.unsubscribe();
      if (cleanupCheck) cleanupCheck();
    };
  }, [router, fallback]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!authenticated) return null;
  return <>{children}</>;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <ProtectedRouteContent fallback={fallback}>{children}</ProtectedRouteContent>
    </Suspense>
  );
}
