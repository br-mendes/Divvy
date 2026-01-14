import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DivvyLogo from '../components/branding/DivvyLogo';
import { getURL } from '../lib/getURL';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validação de senha: Min 8 chars, 1 Maiúscula, 1 Minúscula, 1 Número, 1 Especial
  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Por favor, informe seu nome.');
      return;
    }

    if (!validatePassword(password)) {
      toast.error('A senha deve ter no mínimo 8 caracteres, incluir maiúscula, minúscula, número e caractere especial.');
      return;
    }

    setLoading(true);
    
    // O Supabase Auth armazena o nome nos metadados do usuário
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}` // Avatar padrão inicial
        },
        // Se a confirmação de email estiver ligada, o redirecionamento acontece no link do email.
        // Se desligada, precisamos redirecionar manualmente ou fazer login auto.
        emailRedirectTo: `${getURL()}/auth/callback${router.query.redirect ? `?next=${router.query.redirect}` : ''}`
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Cadastro realizado! Verifique seu email ou faça login.');
      router.push('/login');
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    
    const redirectUrl = new URL(`${getURL()}/auth/callback`);
    if (router.query.redirect) {
        redirectUrl.searchParams.set('next', router.query.redirect as string);
    }

    // O login com Google já captura automaticamente name, email e avatar dos metadados do Google
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <Link href="/" aria-label="Voltar para a home">
            <DivvyLogo className="mx-auto w-16 h-16" />
          </Link>
          <h1 className="text-2xl font-bold mt-4">Criar Conta</h1>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <Input 
            label="Nome Completo" 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            placeholder="Ex: João Silva"
          />
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            placeholder="seu@email.com"
          />
          <div className="space-y-1">
            <Input 
              label="Senha" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500">
              Mínimo 8 caracteres, maiúscula, minúscula, número e especial.
            </p>
          </div>
          <Button type="submit" fullWidth isLoading={loading}>Cadastrar</Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          fullWidth 
          onClick={handleGoogleSignup}
          isLoading={googleLoading}
          className="flex items-center justify-center gap-2"
        >
          {!googleLoading && (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              />
            </svg>
          )}
          Cadastrar com Google
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem conta? <Link href={`/login${router.query.redirect ? `?redirect=${router.query.redirect}` : ''}`} className="text-brand-600 font-bold hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
