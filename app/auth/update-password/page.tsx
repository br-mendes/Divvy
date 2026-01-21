"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DivvyLogo from '@/components/branding/DivvyLogo';
import toast from 'react-hot-toast';
import StaticPageLinks from '@/components/common/StaticPageLinks';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Link inválido ou expirado.');
        router.push('/login');
      }
    });
  }, [router]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
          <div className="text-center mb-8">
            <DivvyLogo className="mx-auto w-16 h-16" />
            <h1 className="text-2xl font-bold mt-4 text-gray-900">Nova Senha</h1>
            <p className="text-gray-500 text-sm mt-1">
              Digite sua nova senha segura.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <Input 
              label="Nova Senha" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
            />
            <Button type="submit" fullWidth isLoading={loading}>
              Atualizar Senha
            </Button>
          </form>
        </div>
        <div className="mt-6">
          <StaticPageLinks className="text-xs text-gray-500" linkClassName="hover:text-brand-600" />
        </div>
      </div>
    </div>
  );
}

