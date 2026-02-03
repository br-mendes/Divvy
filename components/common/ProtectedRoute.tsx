'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export default function ProtectedRoute({ children, fallback = '/auth/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const supabase = createRouteHandlerClient({ cookies });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(fallback);
        return;
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push(fallback);
        }
      });

      return () => subscription.unsubscribe();
    };

    checkAuth();
  }, [router, supabase, fallback]);

  return <>{children}</>;
}