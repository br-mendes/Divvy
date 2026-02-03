'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import CategorySelect from '@/components/common/CategorySelect';
import { formatCurrency } from '@/utils/format';
import styles from './page.module.css';

type Category = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other';
type SplitType = 'equal' | 'custom';

interface Participant {
  name: string;
  email: string;
  share: number;
}

export default function CreateExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form data
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [payer, setPayer] = useState('you@example.com');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [participants, setParticipants] = useState<Participant[]>([
    { name: 'Você', email: 'you@example.com', share: 0 },
    { name: 'João Silva', email: 'joao@example.com', share: 0 },
    { name: 'Maria Santos', email: 'maria@example.com', share: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAmount(value);

    // Auto-calculate equal split
    if (splitType === 'equal') {
      if (!value) {
        setParticipants((current) => current.map((participant) => ({
          ...participant,
          share: 0,
        })));
        return;
      }

      const total = parseFloat(value);
      const share = total / participants.length;
      const newParticipants = participants.map((participant) => ({
        ...participant,
        share,
      }));
      setParticipants(newParticipants);
    }
  };

  const handleShareChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index].share = parseFloat(value) || 0;
    setParticipants(newParticipants);
  };

  const calculateTotalShare = () => {
    return participants.reduce((sum, participant) => sum + participant.share, 0);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!amount) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (splitType === 'custom') {
      const totalShare = calculateTotalShare();
      const expectedAmount = parseFloat(amount) || 0;
      if (Math.abs(totalShare - expectedAmount) > 0.01) {
        newErrors.split = `Total da divisão (${formatCurrency(Math.round(totalShare * 100))}) deve ser igual ao valor (${formatCurrency(Math.round(expectedAmount * 100))})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Chamar API de criação de despesa
      // const response = await fetch('/api/expenses', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     description,
      //     amount: Math.round(parseFloat(amount) * 100),
      //     category,
      //     payer,
      //     split_type: splitType,
      //     participants,
      //   }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard/expenses');
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(amount) || 0;
  const totalShare = calculateTotalShare();
  const isBalanced = Math.abs(totalShare - totalAmount) < 0.01;

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1>Adicionar Despesa</h1>
          <p>Registre uma nova despesa e defina como será dividida</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Description */}
          <Input
            label="Descrição"
            type="text"
            placeholder="Ex: Jantar no restaurante"
            value={description}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
            error={errors.description}
            required
          />

          {/* Amount */}
          <Input
            label="Valor (R$)"
            type="number"
            placeholder="0.00"
            step="0.01"
            value={amount}
            onChange={handleAmountChange}
            error={errors.amount}
            required
          />

          {/* Category */}
          <CategorySelect value={category} onChange={(value) => setCategory(value as Category)} />

          {/* Payer */}
          <div>
            <label className={styles.label} htmlFor="payer">
              Quem pagou?
            </label>
            <select
              id="payer"
              className={styles.select}
              value={payer}
              onChange={(event) => setPayer(event.target.value)}
            >
              {participants.map((participant) => (
                <option key={participant.email} value={participant.email}>
                  {participant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type */}
          <div>
            <label className={styles.label}>Divisão</label>
            <div className={styles.splitTypeButtons}>
              <button
                type="button"
                className={`${styles.splitButton} ${splitType === 'equal' ? styles.active : ''}`}
                onClick={() => {
                  setSplitType('equal');
                  if (amount) {
                    const total = parseFloat(amount);
                    const share = total / participants.length;
                    const newParticipants = participants.map((participant) => ({
                      ...participant,
                      share,
                    }));
                    setParticipants(newParticipants);
                  }
                }}
              >
                Igual
              </button>
              <button
                type="button"
                className={`${styles.splitButton} ${splitType === 'custom' ? styles.active : ''}`}
                onClick={() => setSplitType('custom')}
              >
                Customizado
              </button>
            </div>
          </div>

          {/* Participants Split */}
          <div className={styles.participantsSection}>
            <h3>Divisão entre participantes</h3>
            <div className={styles.participantsList}>
              {participants.map((participant, index) => (
                <div key={participant.email} className={styles.participantItem}>
                  <div className={styles.participantInfo}>
                    <p className={styles.participantName}>{participant.name}</p>
                    <p className={styles.participantEmail}>{participant.email}</p>
                  </div>
                  <div className={styles.participantShare}>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={participant.share}
                      onChange={(event) => handleShareChange(index, event.target.value)}
                      disabled={splitType === 'equal'}
                      className={styles.shareInput}
                    />
                    <span className={styles.shareLabel}>R$</span>
                  </div>
                </div>
              ))}
            </div>

            {errors.split && <p className={styles.error}>{errors.split}</p>}

            <div className={styles.splitSummary}>
              <div className={styles.summaryItem}>
                <span>Valor total:</span>
                <strong>{formatCurrency(Math.round(totalAmount * 100))}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Total dividido:</span>
                <strong className={isBalanced ? styles.balanced : styles.unbalanced}>
                  {formatCurrency(Math.round(totalShare * 100))}
                </strong>
              </div>
              {!isBalanced && (
                <p className={styles.unbalancedWarning}>
                  Os valores não batem. Verifique a divisão.
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttons}>
            <Link href="/dashboard/expenses">
              <Button variant="outline" size="md" fullWidth>
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Despesa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
