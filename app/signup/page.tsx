'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { signup, error, loading, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (name.length < 3) {
      errors.name = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }

    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      errors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Senha deve conter pelo menos uma letra maiúscula';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Senha deve conter pelo menos um número';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Senhas não correspondem';
    }

    if (!acceptTerms) {
      errors.terms = 'Você deve aceitar os termos e condições';
    }

    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await signup(email, password, name);
      router.push('/dashboard');
    } catch (err) {
      // Erro já é tratado no contexto
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <Logo size="md" animated={true} />
          <h1>Criar Conta</h1>
          <p>Junte-se à Divvy e comece a gerenciar despesas</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}></span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome Completo"
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formError.name) {
                setFormError({ ...formError, name: '' });
              }
            }}
            error={formError.name}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formError.email) {
                setFormError({ ...formError, email: '' });
              }
            }}
            error={formError.email}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            helperText="Mínimo 8 caracteres, com maiúscula e número"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError.password) {
                setFormError({ ...formError, password: '' });
              }
            }}
            error={formError.password}
            showPasswordToggle={true}
            required
          />

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formError.confirmPassword) {
                setFormError({ ...formError, confirmPassword: '' });
              }
            }}
            error={formError.confirmPassword}
            showPasswordToggle={true}
            required
          />

          <div className={styles.termsCheckbox}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (formError.terms) {
                  setFormError({ ...formError, terms: '' });
                }
              }}
              className={styles.checkbox}
            />
            <label htmlFor="terms" className={styles.termsLabel}>
              Eu aceito os{' '}
              <Link href="/terms" target="_blank">
                termos e condições
              </Link>{' '}
              e a{' '}
              <Link href="/privacy" target="_blank">
                política de privacidade
              </Link>
            </label>
          </div>

          {formError.terms && <p className={styles.error}>{formError.terms}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <div className={styles.socialSignup}>
          <Button variant="outline" size="lg" fullWidth>
            Cadastrar com Google
          </Button>
        </div>

        <div className={styles.footer}>
          <p>
            Já tem uma conta?{' '}
            <Link href="/login" className={styles.link}>
              Faça login
            </Link>
          </p>
        </div>
      </div>

      <div className={styles.infoPanel}>
        <div className={styles.infoPanelContent}>
          <h2>Por que Divvy?</h2>
          <ul className={styles.infoList}>
            <li>Divida despesas de forma justa e inteligente</li>
            <li>Rastreie todos os gastos em tempo real</li>
            <li>Convide amigos facilmente</li>
            <li>Seus dados estão seguros</li>
            <li>Funciona em qualquer dispositivo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
