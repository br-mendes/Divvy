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
    let hasRedirected = false;
    
    const doRedirect = () => {
      if (hasRedirected) return;
      hasRedirected = true;
      
      const sp = new URLSearchParams(window.location.search);
      const nextParam = sp.get('next') || sp.get('redirect') || '/dashboard';
      const next = decodeURIComponent(nextParam);
      console.log('🚀 Redirecting to:', next);
      router.push(next);
    };

    const handleCallback = async () => {
      console.log('🔄 Auth callback: Processing OAuth...');
      console.log('🔗 Current URL:', window.location.href);

      const sp = new URLSearchParams(window.location.search);
      const code = sp.get('code');
      if (code) {
        console.log('🔁 Exchanging OAuth code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        console.log('🔁 Exchange result:', { ok: !exchangeError, error: exchangeError?.message });
      }
      
      // Check if we already have a session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        console.log('✅ Session already exists:', initialSession.user?.email);
        await ensureProfile(initialSession.user);
        toast.success('Login realizado com sucesso!');
        setTimeout(() => doRedirect(), 100);
        return;
      }
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        console.log('📡 Auth state changed:', event, session?.user?.email);
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          subscription.unsubscribe();
          console.log('✅ Auth successful, preparing redirect...');
          
          try {
            await ensureProfile(session.user);
          } catch (e) {
            console.error('Profile creation error:', e);
          }
          
          toast.success('Login realizado com sucesso!');
          setTimeout(() => doRedirect(), 500);
        }
      });

      // Timeout fallback
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        console.error('⏰ Auth timeout - no session detected');
        setError('Tempo de autenticação excedido');
        setTimeout(() => router.push('/auth/login'), 2000);
      }, 10000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    };

    handleCallback();
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
      <p className="text-gray-500 mt-2">Você será redirecionado em instantes.</p>
    </div>
  );
}