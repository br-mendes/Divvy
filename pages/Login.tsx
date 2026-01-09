import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DivvyLogo from '../components/branding/DivvyLogo';
import toast, { Toaster } from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      navigate(redirectUrl);
    } catch (err: any) {
      const message = err.message;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200 shadow-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <DivvyLogo className="w-20 h-20 mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-dark">Divvy</h1>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Bem-vindo de volta</h2>
          <p className="text-gray-500 mt-2">Faça login para acessar suas despesas</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Entrando...' : 'Fazer login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          Não tem conta?{' '}
          <Link 
            to={`/signup?redirect=${encodeURIComponent(redirectUrl)}`} 
            className="text-brand-600 font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <Link to="/auth/reset" className="text-brand-600 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
      </div>
    </div>
  );
};