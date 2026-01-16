'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const passwordRequirements = [
  { regex: /.{8,}/, label: 'Mínimo 8 caracteres' },
  { regex: /[A-Z]/, label: 'Uma letra maiúscula' },
  { regex: /[a-z]/, label: 'Uma letra minúscula' },
  { regex: /[0-9]/, label: 'Um número' },
  { regex: /[!@#$%^&*]/, label: 'Um caractere especial (!@#$%^&*)' },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    for (const req of passwordRequirements) {
      if (req.regex.test(pwd)) {
        strength++;
      }
    }
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (passwordStrength < 5) {
      newErrors.password = 'Senha não atende todos os requisitos';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não correspondem';
    }

    if (!formData.acceptTerms) {
      newErrors.terms = 'Você deve aceitar os Termos de Serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.fullName);
      router.push('/dashboard');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao fazer cadastro. Tente novamente.'
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <Logo size="lg" animated={true} />
          <h1>Cadastro</h1>
          <p>Crie sua conta Divvy em 2 minutos</p>
        </div>

        {submitError && (
          <div className={styles.errorAlert}>
            <span>⚠️</span>
            <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome Completo"
            type="text"
            placeholder="João Silva"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <div>
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handlePasswordChange}
              error={errors.password}
              showPasswordToggle
              required
            />
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={`${styles.strengthFill} ${
                      styles[`strength-${passwordStrength}`]
                    }`}
                  />
                </div>
                <ul className={styles.requirementsList}>
                  {passwordRequirements.map((req, idx) => (
                    <li
                      key={idx}
                      className={req.regex.test(formData.password) ? styles.met : ''}
                    >
                      <span>{req.regex.test(formData.password) ? '✓' : '✗'}</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
            showPasswordToggle
            required
          />

          <div className={styles.checkboxGroup}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTerms: e.target.checked })
                }
              />
              <label htmlFor="terms">
                Aceito os{' '}
                <Link href="/terms" target="_blank">
                  Termos de Serviço
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className={styles.checkboxError}>{errors.terms}</p>
            )}

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="privacy"
                checked={formData.acceptPrivacy}
                onChange={(e) =>
                  setFormData({ ...formData, acceptPrivacy: e.target.checked })
                }
              />
              <label htmlFor="privacy">
                Aceito a{' '}
                <Link href="/privacy" target="_blank">
                  Política de Privacidade
                </Link>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Já tem conta?{' '}
            <Link href="/login" className={styles.link}>
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
