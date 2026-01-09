import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // With supabase helpers for Next.js (if used) this is automatic, but with client-side lib:
      // The router.query might be empty on first render if it's hash based, but supabase usually redirects with code query param.
      // If we are using hash (default for implicit flow), we need to parse window.location.hash.
      // If we are using PKCE (default for SSR), we get a code.

      // We check for both.
      const { code } = router.query;
      
      if (code && typeof code === 'string') {
        try {
           const { error } = await supabase.auth.exchangeCodeForSession(code);
           if (error) throw error;
           router.push('/dashboard');
        } catch (error: any) {
           toast.error(error.message);
           router.push('/login');
        }
        return;
      }

      // Check hash for legacy implicit flow or fallback
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
         const { data, error } = await supabase.auth.getSession();
         if (!error && data.session) {
            router.push('/dashboard');
         } else {
            router.push('/login');
         }
      } else {
         // Just check if we have a session
         const { data } = await supabase.auth.getSession();
         if (data.session) {
            router.push('/dashboard');
         } else if (router.isReady && !code) {
            // Only redirect if router is ready and really no code found
             router.push('/login');
         }
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Verificando autenticação...</h2>
      <p className="text-gray-500 mt-2">Aguarde enquanto confirmamos seus dados.</p>
    </div>
  );
}