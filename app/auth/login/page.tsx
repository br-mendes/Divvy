'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200 shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao Divvy</h1>
      <p className="text-gray-600 mb-6">Faça login para acessar suas despesas</p>

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
        <Button type="submit" fullWidth loading={loading}>
          Fazer login
        </Button>
      </form>

      <div className="mt-6 text-center text-gray-600">
        Não tem conta?{' '}
        <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
