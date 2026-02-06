'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

async function syncCookieSession(session: any) {
  // session deve ter access_token e refresh_token
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session?.access_token,
      refresh_token: session?.refresh_token,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || 'COOKIE_SYNC_FAILED');
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hasRedirected = false;

    const doRedirect = () => {
      if (hasRedirected) return;
      hasRedirected = true;

      const sp = new URLSearchParams(window.location.search);
      const nextParam = sp.get('next') || sp.get('redirect') || '/dashboard';
      const next = decodeURIComponent(nextParam);

      router.push(next.startsWith('/') ? next : '/dashboard');
    };

    const handle = async () => {
      try {
        // 1) pega session do cliente
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          // 2) sincroniza para cookie no servidor
          await syncCookieSession(initialSession);

          toast.success('Login realizado com sucesso!');
          doRedirect();
          return;
        }

        // 3) fallback: escuta mudanca de auth (PKCE)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          console.log(' Auth state changed:', event, session?.user?.email);

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            subscription.unsubscribe();

            try {
              await syncCookieSession(session);
            } catch (e: any) {
              console.error('Cookie sync error:', e);
              setError(e?.message || 'COOKIE_SYNC_FAILED');
              return;
            }

            toast.success('Login realizado com sucesso!');
            doRedirect();
          }
        });

        // 10s timeout
        setTimeout(() => {
          try {
            subscription.unsubscribe();
          } catch {}
          if (!hasRedirected) {
            setError('Tempo de autenticacao excedido');
            setTimeout(() => router.push('/auth/login'), 1200);
          }
        }, 10000);
      } catch (e: any) {
        console.error('Callback error:', e);
        setError(e?.message || 'Erro ao finalizar login');
        setTimeout(() => router.push('/auth/login'), 1200);
      }
    };

    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600 mb-4"></div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <h2 className="text-xl font-semibold text-gray-700">Finalizando acesso...</h2>
      <p className="text-gray-500 mt-2">Voce sera redirecionado em instantes.</p>
    </div>
  );
}
