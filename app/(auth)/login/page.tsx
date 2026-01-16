'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import LogoAnimated from '@/components/common/LogoAnimated';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (err) {
      const message = (err as Error).message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Logo */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <LogoAnimated />
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200 shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Divvy
          </h1>
          <p className="text-gray-600 mb-6">
            Faça login para acessar suas despesas
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              Fazer login
            </Button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Não tem conta?{' '}
            <Link href="/auth/signup" className="text-[#208085] font-semibold hover:underline">
              Criar conta
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/auth/reset" className="text-[#208085] hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
