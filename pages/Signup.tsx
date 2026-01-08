import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast, { Toaster } from 'react-hot-toast';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          });

        if (profileError) {
           console.warn("Could not create user profile:", profileError.message);
        }
      }

      toast.success('Conta criada com sucesso! Verifique seu email.');
      // Forward the redirect param to the login page so flow continues after login
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
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
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Criar conta no Divvy</h2>
          <p className="text-gray-500 mt-2">Comece a organizar suas despesas em grupo</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            id="fullName"
            label="Nome completo"
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            placeholder="Seu nome"
            required
          />

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

          <Input
            id="confirmPassword"
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          Já tem conta?{' '}
          <Link 
            to={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="text-brand-600 font-semibold hover:underline"
          >
            Fazer login
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Ao criar conta, você concorda com nossos{' '}
          <Link to="/terms" className="text-brand-600 hover:underline">
            Termos de Serviço
          </Link>
          .
        </p>
      </div>
    </div>
  );
};