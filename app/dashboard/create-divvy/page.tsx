'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Stepper } from '@/components/common/Stepper';
import styles from './page.module.css';

type DivvyType = 'trip' | 'roommate' | 'couple' | 'event' | 'other';

interface DivvyFormData {
  name: string;
  description: string;
  type: DivvyType;
  members: string[];
  currency: string;
}

const divvyTypes = [
  {
    value: 'trip' as DivvyType,
    label: ' Viagem',
    description: 'Despesas de viagem em grupo',
  },
  {
    value: 'roommate' as DivvyType,
    label: ' República',
    description: 'Contas compartilhadas da casa',
  },
  {
    value: 'couple' as DivvyType,
    label: ' Casal',
    description: 'Despesas com seu parceiro',
  },
  {
    value: 'event' as DivvyType,
    label: ' Evento',
    description: 'Organize festas e eventos',
  },
  {
    value: 'other' as DivvyType,
    label: ' Outro',
    description: 'Qualquer outro tipo',
  },
];

const steps = ['Tipo', 'Informações', 'Membros', 'Confirmação'];

export default function CreateDivvyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DivvyFormData>({
    name: '',
    description: '',
    type: 'trip',
    members: [''],
    currency: 'BRL',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.type) {
        newErrors.type = 'Selecione um tipo de Divvy';
      }
    } else if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (formData.name.length > 50) {
        newErrors.name = 'Nome deve ter no máximo 50 caracteres';
      }
    } else if (currentStep === 2) {
      const validMembers = formData.members.filter((m) => m.trim());
      if (validMembers.length < 2) {
        newErrors.members = 'Adicione pelo menos 2 membros';
      }
      const validEmails = validMembers.every((m) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)
      );
      if (!validEmails) {
        newErrors.members = 'Todos os emails devem ser válidos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      // TODO: Chamar API de criação de Divvy
      // const response = await fetch('/api/divvies', {
      //   method: 'POST',
      //   body: JSON.stringify(formData),
      // });

      // Mock para teste
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard/divvies');
    } catch (error) {
      console.error('Erro ao criar Divvy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const addMember = () => {
    setFormData({ ...formData, members: [...formData.members, ''] });
  };

  const removeMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1>Criar Nova Divvy</h1>
          <p>Siga os passos abaixo para criar sua Divvy</p>
        </div>

        <Stepper steps={steps} currentStep={currentStep} />

        {/* Step 0: Select Type */}
        {currentStep === 0 && (
          <div className={styles.stepContent}>
            <h2>Qual é o tipo de Divvy?</h2>
            <div className={styles.typeGrid}>
              {divvyTypes.map((type) => (
                <Card
                  key={type.value}
                  onClick={() => {
                    setFormData({ ...formData, type: type.value });
                    setErrors({});
                  }}
                  className={`${styles.typeCard} ${
                    formData.type === type.value ? styles.selected : ''
                  }`}
                >
                  <div className={styles.typeCardContent}>
                    <span className={styles.typeIcon}>
                      {type.label.split(' ')[0]}
                    </span>
                    <h3>{type.label.slice(2)}</h3>
                    <p>{type.description}</p>
                  </div>
                </Card>
              ))}
            </div>
            {errors.type && <p className={styles.error}>{errors.type}</p>}
          </div>
        )}

        {/* Step 1: Information */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2>Informações da Divvy</h2>
            <form className={styles.form}>
              <Input
                label="Nome da Divvy"
                type="text"
                placeholder="Ex: Viagem RJ 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />

              <div>
                <label className={styles.label}>Descrição (opcional)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Adicione detalhes sobre esta Divvy..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div>
                <label className={styles.label} htmlFor="currency">
                  Moeda
                </label>
                <select
                  id="currency"
                  className={styles.select}
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                >
                  <option value="BRL"> Real (BRL)</option>
                  <option value="USD"> Dólar (USD)</option>
                  <option value="EUR"> Euro (EUR)</option>
                </select>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Members */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2>Adicione os Membros</h2>
            <p className={styles.subtitle}>
              Convide os membros pelo email. Eles receberão um convite para
              participar.
            </p>
            <form className={styles.form}>
              <div className={styles.membersForm}>
                {formData.members.map((member, index) => (
                  <div key={index} className={styles.memberInput}>
                    <Input
                      type="email"
                      placeholder={`Email do membro ${index + 1}`}
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                    />
                    {formData.members.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMember(index)}
                      >
                        ✕ Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={addMember}
              >
                + Adicionar Membro
              </Button>

              {errors.members && <p className={styles.error}>{errors.members}</p>}
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <h2>Confirme os Detalhes</h2>
            <div className={styles.confirmationCards}>
              <Card>
                <div className={styles.confirmationItem}>
                  <label>Tipo</label>
                  <p>
                    {divvyTypes.find((t) => t.value === formData.type)?.label}
                  </p>
                </div>
              </Card>

              <Card>
                <div className={styles.confirmationItem}>
                  <label>Nome</label>
                  <p>{formData.name}</p>
                </div>
              </Card>

              <Card>
                <div className={styles.confirmationItem}>
                  <label>Moeda</label>
                  <p>{formData.currency}</p>
                </div>
              </Card>

              <Card>
                <div className={styles.confirmationItem}>
                  <label>
                    Membros ({formData.members.filter((m) => m.trim()).length})
                  </label>
                  <ul className={styles.membersList}>
                    {formData.members
                      .filter((m) => m.trim())
                      .map((member, index) => (
                        <li key={index}>{member}</li>
                      ))}
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          <Link href="/dashboard/divvies">
            <Button variant="outline" size="md">
              Cancelar
            </Button>
          </Link>

          <div className={styles.navButtons}>
            {currentStep > 0 && (
              <Button variant="outline" size="md" onClick={handlePrev}>
                ← Anterior
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button variant="primary" size="md" onClick={handleNext}>
                Próximo →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                loading={loading}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Criando...' : '✓ Criar Divvy'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
