'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getURL, sanitizeNextPath } from '@/lib/getURL';

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

async function upsertUserProfile(user: User) {
  const now = new Date().toISOString();
  const email = user.email || '';
  const fullName = user.user_metadata?.full_name || '';
  const displayName = fullName || (email ? email.split('@')[0] : 'Usuario');

  // Canonical table: userprofiles (snake_case)
  await supabase
    .from('userprofiles')
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        display_name: displayName,
        created_at: now,
        updated_at: now,
      } as any,
      { onConflict: 'id' }
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, nextSession: any) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === 'SIGNED_IN' && nextSession?.user) {
        Promise.resolve(upsertUserProfile(nextSession.user)).catch((e) => {
          console.error('Auto profile upsert error:', e);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    if (data.user) {
      await upsertUserProfile(data.user);
    }
  };

  const signInWithGoogle = async (nextPath?: string) => {
    const nextSafe = sanitizeNextPath(nextPath);
    const redirectTo = `${getURL()}/auth/callback?next=${encodeURIComponent(nextSafe)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

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
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
