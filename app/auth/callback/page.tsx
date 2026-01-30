"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  const ensureProfile = async (sessionUser: any) => {
    const now = new Date().toISOString();
    const email = sessionUser?.email || '';
    const fullName = sessionUser?.user_metadata?.full_name || '';

    // Canonical table: userprofiles
    try {
      const { data: profile, error } = await supabase
        .from('userprofiles')
        .select('id')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (!error) {
        if (!profile) {
          await supabase.from('userprofiles').upsert(
            {
              id: sessionUser.id,
              email,
              fullname: fullName,
              displayname: fullName || (email ? email.split('@')[0] : 'Usuário'),
              createdat: now,
              updatedat: now,
            },
            { onConflict: 'id' }
          );
        }
        return;
      }

      const msg = String(error.message || '').toLowerCase();
      if (!msg.includes('does not exist') && !msg.includes('relation') && !msg.includes('schema cache')) {
        return;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: user_profiles
    try {
      await supabase.from('user_profiles').upsert(
        {
          id: sessionUser.id,
          email,
          full_name: fullName,
          display_name: fullName || (email ? email.split('@')[0] : 'Usuário'),
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error.message);
        toast.error('Erro na autenticação.');
        router.push('/auth/login');
        return;
      }

      const doRedirect = () => {
        const sp = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const nextParam = sp.get('next') || sp.get('redirect') || hashParams.get('next') || hashParams.get('redirect');

        if (nextParam && nextParam.startsWith('/')) {
          router.push(decodeURIComponent(nextParam));
        } else {
          router.push('/dashboard');
        }
      };

      if (session) {
        try {
          await ensureProfile(session.user);
        } catch (e) {
          console.error('Auto profile creation error', e);
        }

        toast.success('Login realizado com sucesso!');
        doRedirect();
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            ensureProfile(session.user);
            doRedirect();
          }
        });

        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          if (!session) router.push('/auth/login');
        }, 5000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Finalizando acesso...</h2>
      <p className="text-gray-500 mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
}
