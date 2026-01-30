'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { signup, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, fullName);
      toast.success('Conta criada! Verifique seu email.');
      const sp = new URLSearchParams(window.location.search);
      const redirect = sp.get('redirect') || sp.get('next');
      const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
      router.push(`/auth/login${suffix}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('redirect') || sp.get('next') || '/dashboard';
      await signInWithGoogle(next);
    } catch (err) {
      toast.error('Erro ao cadastrar com Google. Tente novamente.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200 shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar conta no Divvy</h1>
      <p className="text-gray-600 mb-6">Comece a organizar suas despesas em grupo</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Seu nome"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          showPasswordToggle
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          showPasswordToggle
          required
        />
        <Button type="submit" fullWidth loading={loading}>
          Criar conta
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 uppercase tracking-wider text-xs">ou continue com</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleGoogleSignup}
        loading={googleLoading}
        className="flex items-center justify-center gap-3 border-gray-300 hover:border-brand-300 transition-all"
      >
        {!googleLoading ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        ) : null}
        Google
      </Button>

      <div className="mt-6 text-center text-gray-600">
        Já tem conta?{' '}
        <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
