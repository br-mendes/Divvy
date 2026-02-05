'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

async function ensureProfile(sessionUser: any) {
  const now = new Date().toISOString();
  const email = sessionUser?.email || '';
  const fullName = sessionUser?.user_metadata?.full_name || '';

  try {
    const { data: profile, error } = await supabase
      .from('userprofiles')
      .select('id')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (!error && !profile) {
      await supabase
        .from('userprofiles')
        .upsert(
          {
            id: sessionUser.id,
            email,
            full_name: fullName,
            display_name: fullName || (email ? email.split('@')[0] : 'Usuario'),
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'id' }
        );
    }
  } catch {
    // ignore
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    if (typeof window === 'undefined') return '/dashboard';
    const sp = new URLSearchParams(window.location.search);
    const nextParam = sp.get('next') || sp.get('redirect') || '/dashboard';
    try {
      const decoded = decodeURIComponent(nextParam);
      return decoded.startsWith('/') ? decoded : '/dashboard';
    } catch {
      return '/dashboard';
    }
  }, []);

  const redirectedRef = useRef(false);
  const redirect = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(nextPath);
    // Fallback: force navigation if router stalls.
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
          window.location.assign(`${window.location.origin}${nextPath}`);
        }
      } catch {
        // ignore
      }
    }, 250);
  };

  useEffect(() => {
    let cancelled = false;

    const sub = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('[auth-callback] state:', event, session?.user?.email);
      if (cancelled) return;

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        try {
          await ensureProfile(session.user);
        } catch (e) {
          console.error('[auth-callback] ensureProfile failed', e);
        }
        toast.success('Login realizado com sucesso!');
        redirect();
      }
    });

    const run = async () => {
      console.log('[auth-callback] url:', window.location.href);

      // Start code exchange in parallel, but do not block redirect logic.
      const sp = new URLSearchParams(window.location.search);
      const code = sp.get('code');
      if (code) {
        console.log('[auth-callback] exchanging code for session...');
        Promise.race([
          supabase.auth.exchangeCodeForSession(code),
          sleep(12000).then(() => ({ error: new Error('exchange timeout') } as any)),
        ])
          .then((r: any) => {
            const msg = r?.error?.message;
            if (msg) console.warn('[auth-callback] exchange result error:', msg);
            else console.log('[auth-callback] exchange result ok');

            if (!msg) {
              supabase.auth
                .getSession()
                .then(({ data }: any) => {
                  if (data?.session?.user && !redirectedRef.current) {
                    console.log('[auth-callback] session detected after exchange');
                    redirect();
                  }
                })
                .catch(() => {
                  // ignore
                });
            }
          })
          .catch((e) => console.warn('[auth-callback] exchange exception', e));
      }

      // Poll for session for a short period as a fallback.
      for (let i = 0; i < 10 && !cancelled && !redirectedRef.current; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          console.log('[auth-callback] session detected via poll');
          try {
            await ensureProfile(data.session.user);
          } catch (e) {
            console.error('[auth-callback] ensureProfile failed', e);
          }
          toast.success('Login realizado com sucesso!');
          redirect();
          return;
        }
        await sleep(300);
      }

      if (!redirectedRef.current && !cancelled) {
        console.error('[auth-callback] no session after waiting');
        setError('Nao foi possivel concluir o login. Tente novamente.');
        setTimeout(() => router.replace('/auth/login'), 1500);
      }
    };

    run();

    return () => {
      cancelled = true;
      sub.data.subscription.unsubscribe();
    };
  }, [router, nextPath]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600 mb-4" />
      {error ? (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      ) : null}
      <h2 className="text-xl font-semibold text-gray-700">Finalizando acesso...</h2>
      <p className="text-gray-500 mt-2">Voce sera redirecionado em instantes.</p>
    </div>
  );
}
