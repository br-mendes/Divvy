import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);
  return <div className="min-h-screen flex items-center justify-center">Processando...</div>;
}