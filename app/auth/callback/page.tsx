'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface EnsureProfileResult {
  data: any;
  error?: {
    message?: string;
  };
}

const ensureProfile = async (sessionUser: any) => {
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
      await supabase.from('userprofiles').upsert({
        id: sessionUser.id,
        email,
        full_name: fullName,
        display_name: fullName || (email ? email.split('@')[0] : 'Usuário'),
        created_at: now,
        updated_at: now,
      }, {
        onConflict: 'id'
      });
    }
  } catch {
    // ignore and fallback
  }
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback: Processing OAuth...');
      console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'server');
      console.log('URL params:', typeof window !== 'undefined' ? window.location.search : 'no-window');
      console.log('URL hash:', typeof window !== 'undefined' ? window.location.hash : 'no-window');
      
      const { data: { session: callbackSession }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session result:', { 
        hasSession: !!callbackSession, 
        userId: callbackSession?.user?.id, 
        email: callbackSession?.user?.email,
        error: sessionError?.message 
      });
      
      if (sessionError) {
        console.error('Auth Callback Error:', sessionError);
        console.error('Error details:', sessionError);
        setError(sessionError.message || 'Erro desconhecido');
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      console.log('Auth callback: Session found:', !!callbackSession, 'User:', callbackSession?.user?.email);

      const doRedirect = () => {
        const sp = new URLSearchParams(window.location.search);
        const nextParam = sp.get('next') || sp.get('redirect') || '/dashboard';
        const next = decodeURIComponent(nextParam);
        console.log('Redirecting to:', next);
        router.push(next);
      };

      if (callbackSession) {
        try {
          await ensureProfile(callbackSession.user);
        } catch (e) {
          console.error('Auto profile creation error', e);
        }

        toast.success('Login realizado com sucesso!');
        setTimeout(() => doRedirect(), 100);
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            try {
              await ensureProfile(session.user);
            } catch (e) {
              console.error('Auto profile creation error', e);
            }
            toast.success('Login realizado com sucesso!');
            setTimeout(() => doRedirect(), 100);
          }
        });

        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          if (!callbackSession) router.push('/auth/login');
        }, 8000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600 mb-4"></div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <h2 className="text-xl font-semibold text-gray-700">Finalizando acesso...</h2>
      <p className="text-gray-500 mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
}