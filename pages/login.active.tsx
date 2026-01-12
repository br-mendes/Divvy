
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DivvyLogo from '../components/branding/DivvyLogo';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { getURL } from '../lib/getURL';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 2FA State
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');

  const handleSuccessfulLogin = async (userId: string) => {
    // Fire and forget update of last_login_at
    supabase.from('userprofiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
        .then(({ error }) => {
            if (error) console.error("Failed to update last_login", error);
        });
    
    router.push('/dashboard');
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Login inicial (Email/Senha)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      if (data.user) {
         // 2. Verificar se o nível de segurança exige 2FA (AAL2)
         const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
         
         if (mfaError) throw mfaError;

         // Se o próximo nível for aal2, significa que o usuário tem 2FA configurado mas logou apenas com senha (aal1)
         if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors.totp[0];

            if (totpFactor) {
               setMfaFactorId(totpFactor.id);
               setShowMfaInput(true);
               setLoading(false);
               toast('Autenticação de dois fatores necessária.', { icon: '🛡️' });
               return; 
            }
         }

         // Login completo
         await handleSuccessfulLogin(data.user.id);
      }

    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaCode || mfaCode.length !== 6) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaCode,
      });

      if (error) throw error;

      toast.success("Login verificado!");
      if (data.user) {
          await handleSuccessfulLogin(data.user.id);
      }
    } catch (error: any) {
      toast.error("Código incorreto. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const redirectTo = `${getURL()}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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

  if (showMfaInput) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
           <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="mx-auto w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificação em Duas Etapas</h2>
              <p className="text-gray-500 text-sm mb-6">
                 Digite o código de 6 dígitos do seu aplicativo autenticador para continuar.
              </p>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                 <Input 
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000 000"
                    className="text-center text-2xl tracking-widest font-mono py-3"
                    autoFocus
                 />
                 <Button type="submit" fullWidth isLoading={loading}>Verificar</Button>
              </form>
              
              <button onClick={() => setShowMfaInput(false)} className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline">
                 Voltar para login
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-100">
        <div className="text-center mb-8">
          <DivvyLogo className="mx-auto w-16 h-16" />
          <h1 className="text-2xl font-bold mt-4 text-gray-900">Bem-vindo de volta</h1>
          <p className="text-gray-500 text-sm mt-1">Acesse sua conta para gerenciar despesas</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
          <div className="space-y-1">
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            <div className="flex justify-end">
              <Link href="/auth/reset" className="text-xs text-brand-600 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
          <Button type="submit" fullWidth isLoading={loading}>Entrar</Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 uppercase tracking-wider text-xs">ou continue com</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          fullWidth 
          onClick={handleGoogleLogin}
          isLoading={googleLoading}
          className="flex items-center justify-center gap-3 border-gray-300 hover:border-brand-300 transition-all shadow-sm"
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
          Google
        </Button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Ainda não tem conta? <Link href="/signup" className="text-brand-600 font-bold hover:underline">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
