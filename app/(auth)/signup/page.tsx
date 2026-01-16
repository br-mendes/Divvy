'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import LogoAnimated from '@/components/common/LogoAnimated';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { validatePassword, validateEmail } from '@/utils/validation';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePassword(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (!fullName.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      if (password !== confirmPassword) {
        throw new Error('As senhas não conferem');
      }

      if (!passwordValidation.isValid) {
        throw new Error('Senha não atende aos requisitos mínimos');
      }

      if (!acceptedTerms || !acceptedPrivacy) {
        throw new Error('Você deve aceitar os termos para criar conta');
      }

      // Criar conta
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signupError) throw signupError;

      // Criar perfil
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          });

        if (profileError) throw profileError;
      }

      toast.success('Conta criada com sucesso! Verifique seu email.');
      router.push('/auth/login');
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
            Criar conta no Divvy
          </h1>
          <p className="text-gray-600 mb-6">
            Comece a organizar suas despesas em grupo
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
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

            <div>
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                showPasswordToggle
                required
              />

              {/* Indicador de força da senha */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          Object.values(passwordValidation.checks).filter(Boolean).length >= level
                            ? passwordValidation.strength === 'strong'
                              ? 'bg-green-500'
                              : passwordValidation.strength === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p className={passwordValidation.checks.length ? 'text-green-600' : ''}>
                      {passwordValidation.checks.length ? '✓' : '○'} Mínimo 8 caracteres
                    </p>
                    <p className={passwordValidation.checks.uppercase ? 'text-green-600' : ''}>
                      {passwordValidation.checks.uppercase ? '✓' : '○'} 1 letra maiúscula
                    </p>
                    <p className={passwordValidation.checks.lowercase ? 'text-green-600' : ''}>
                      {passwordValidation.checks.lowercase ? '✓' : '○'} 1 letra minúscula
                    </p>
                    <p className={passwordValidation.checks.number ? 'text-green-600' : ''}>
                      {passwordValidation.checks.number ? '✓' : '○'} 1 número
                    </p>
                    <p className={passwordValidation.checks.special ? 'text-green-600' : ''}>
                      {passwordValidation.checks.special ? '✓' : '○'} 1 caractere especial (!@#$%...)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirmar senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              showPasswordToggle
              required
            />

            {/* Checkboxes de Termos */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-gray-600">
                  Aceito os{' '}
                  <Link href="/terms" className="text-[#208085] hover:underline">
                    Termos de Serviço
                  </Link>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-gray-600">
                  Aceito a{' '}
                  <Link href="/privacy" className="text-[#208085] hover:underline">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!passwordValidation.isValid || !acceptedTerms || !acceptedPrivacy}
            >
              Criar conta
            </Button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-[#208085] font-semibold hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
