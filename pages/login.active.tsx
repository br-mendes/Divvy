import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DivvyLogo from '../components/branding/DivvyLogo';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <DivvyLogo className="mx-auto w-16 h-16" />
          <h1 className="text-2xl font-bold mt-4">Login</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" fullWidth isLoading={loading}>Entrar</Button>
        </form>
        <p className="mt-4 text-center text-sm">Não tem conta? <Link href="/signup" className="text-brand-600 font-bold">Criar agora</Link></p>
      </div>
    </div>
  );
}