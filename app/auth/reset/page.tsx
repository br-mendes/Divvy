"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DivvyLogo from '@/components/branding/DivvyLogo';
import toast from 'react-hot-toast';
import { getURL } from '../../lib/getURL';
import StaticPageLinks from '../../components/common/StaticPageLinks';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const redirectTo = `${getURL()}/auth/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email.');
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
            <h1 className="text-2xl font-bold mt-4 text-gray-900">Recuperar Senha</h1>
            <p className="text-gray-500 text-sm mt-1">
              Informe seu email para receber o link de redefinição.
            </p>
          </div>

        {!submitted ? (
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
            <Button type="submit" fullWidth isLoading={loading}>
              Enviar Link
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
              Verifique sua caixa de entrada. Enviamos um link para redefinir sua senha.
            </div>
            <p className="text-sm text-gray-500">
              Não recebeu? Verifique a pasta de spam ou tente novamente.
            </p>
            <Button variant="outline" fullWidth onClick={() => setSubmitted(false)}>
              Tentar novamente
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-brand-600 font-bold hover:underline">
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
