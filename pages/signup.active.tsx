import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Verifique seu email!');
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-8">Criar Conta</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" fullWidth isLoading={loading}>Cadastrar</Button>
        </form>
        <p className="mt-4 text-center text-sm">Já tem conta? <Link href="/login" className="text-brand-600 font-bold">Fazer login</Link></p>
      </div>
    </div>
  );
}