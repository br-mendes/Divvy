
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase handles the session exchange automatically on the client
      // but we need to verify we have a session and redirect.
      
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error.message);
        toast.error('Erro na autenticação. Tente novamente.');
        router.push('/login');
        return;
      }

      if (session) {
        toast.success('Bem-vindo de volta!');
        router.push('/dashboard');
      } else {
        // If no session is found after a short delay, redirect to login
        const timer = setTimeout(() => {
          router.push('/login');
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    if (router.isReady) {
      handleCallback();
    }

    // Monitor auth state changes as well (good for some OAuth flows)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Verificando autenticação...</h2>
      <p className="text-gray-500 mt-2">Aguarde enquanto confirmamos seus dados.</p>
    </div>
  );
}
