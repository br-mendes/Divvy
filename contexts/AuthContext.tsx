'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // TODO: Verificar sessão com Supabase
        setLoading(false);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implementar login com Supabase
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      // if (error) throw error;
      // setUser(data.user);

      // Mock para teste
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser({ email, id: '1' });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implementar signup com Supabase
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: { full_name: name },
      //   },
      // });
      // if (error) throw error;
      // setUser(data.user);

      // Mock para teste
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser({ email, name, id: '1' });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // TODO: Implementar logout com Supabase
      // await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao sair da conta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
