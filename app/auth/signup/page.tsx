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
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      router.push('/auth/login');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
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

      <div className="mt-6 text-center text-gray-600">
        Já tem conta?{' '}
        <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
