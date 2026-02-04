'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getURL } from '@/lib/getURL';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Auto-create profile for new sign-ins
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const email = session.user.email || '';
          const fullName = session.user.user_metadata?.full_name || '';
          await upsertUserProfile(session.user, email, fullName);
        } catch (error) {
          console.error('Auto profile creation error:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  function sanitizeNextPath(nextPath?: string) {
    const raw = (nextPath ?? '').trim();
    if (!raw) return '/dashboard';
    if (!raw.startsWith('/')) return '/dashboard';
    // basic hardening: avoid protocol-relative and double slashes
    if (raw.startsWith('//')) return '/dashboard';
    return raw;
  }

  async function upsertUserProfile(user: User, email: string, fullName: string) {
    // Canonical table in this project is `userprofiles`.
    // Keep a fallback to `user_profiles` for older deployments.
    const now = new Date().toISOString();

    try {
      const { error } = await supabase.from('userprofiles').upsert(
        {
          id: user.id,
          email,
          fullname: fullName,
          displayname: fullName || email.split('@')[0],
          createdat: now,
          updatedat: now,
        },
        { onConflict: 'id' }
      );
      if (!error) return;

      const msg = String(error.message || '').toLowerCase();
      if (!msg.includes('does not exist') && !msg.includes('relation') && !msg.includes('schema cache')) {
        return;
      }
    } catch {
      // ignore and fallback
    }

    try {
      await supabase.from('user_profiles').upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          display_name: fullName || email.split('@')[0],
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );
    } catch {
      // ignore
    }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    if (data.user) {
      await upsertUserProfile(data.user, email, fullName);
    }
  };

  const signInWithGoogle = async (nextPath?: string) => {
    const nextSafe = sanitizeNextPath(nextPath);
    const redirectTo = `${getURL()}/auth/callback?next=${encodeURIComponent(nextSafe)}`;

    // Generate and store state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('google_oauth_state', state);
    }

    console.log('🚀 Google OAuth Initiated:');
    console.log('- Next path:', nextPath);
    console.log('- Sanitized next:', nextSafe);
    console.log('- Redirect URL:', redirectTo);
    console.log('- Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server');
    console.log('- OAuth state:', state);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });
      
      console.log('✅ OAuth Response received:');
      console.log('- Data:', data);
      console.log('- Error:', error);
      console.log('- Error message:', error?.message);
      
      if (error) {
        console.error('❌ Google OAuth Error Details:', error);
        throw new Error(`Google OAuth failed: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Google OAuth Exception:', err);
      throw err;
    }
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};