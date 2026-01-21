'use client';

import { useState, useCallback, useContext, createContext, ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Chamar API de login
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password }),
      // });

      // Mock para teste
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser({
        id: '1',
        email,
        full_name: 'Usuário Teste',
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // TODO: Chamar API de signup
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password, full_name: fullName }),
      // });

      // Mock para teste
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser({
        id: '1',
        email,
        full_name: fullName,
      });
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Chamar API de logout
      // await fetch('/api/auth/logout', { method: 'POST' });

      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
