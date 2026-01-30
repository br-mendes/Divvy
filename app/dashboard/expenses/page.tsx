'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { formatCurrency, formatDate } from '@/utils/format';

import styles from './page.module.css';

type ExpenseItem = {
  id: string;
  description: string;
  amount_cents: number;
  payer: string;
  category: 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other';
  date: string;
  participants: number;
};

const categoryIcons: Record<ExpenseItem['category'], string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  entertainment: '🎉',
  other: '📝',
};

export default function ExpensesPage() {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const expenses = useMemo<ExpenseItem[]>(
    () => [
      {
        id: '1',
        description: 'Hospedagem Hotel',
        amount_cents: 50000,
        payer: 'João Silva',
        category: 'accommodation',
        date: '2026-01-14',
        participants: 3,
      },
      {
        id: '2',
        description: 'Jantar no restaurante',
        amount_cents: 15000,
        payer: 'Maria Santos',
        category: 'food',
        date: '2026-01-13',
        participants: 2,
      },
    ],
    []
  );

  const visible = useMemo(() => {
    if (!filterCategory || filterCategory === 'all') return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Despesas</h1>
        <Link href="/dashboard/expenses/create">
          <Button variant="primary" size="md">
            + Nova despesa
          </Button>
        </Link>
      </div>

      <div className={styles.filters}>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={styles.select}
        >
          <option value="all">Todas as categorias</option>
          <option value="food">Comida</option>
          <option value="transport">Transporte</option>
          <option value="accommodation">Hospedagem</option>
          <option value="entertainment">Entretenimento</option>
          <option value="other">Outro</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🧾</p>
            <h3>Nenhuma despesa registrada</h3>
            <p>Comece a adicionar despesas para rastrear gastos</p>
            <Link href="/dashboard/expenses/create">
              <Button variant="primary" size="md">
                + Adicionar despesa
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className={styles.expensesList}>
          {visible.map((expense) => (
            <div key={expense.id} className={styles.expenseCard}>
              <div className={styles.expenseIcon}>{categoryIcons[expense.category]}</div>
              <div className={styles.expenseDetails}>
                <div className={styles.expenseHeader}>
                  <h3>{expense.description}</h3>
                  <span className={styles.amount}>{formatCurrency(expense.amount_cents)}</span>
                </div>
                <p className={styles.expenseMeta}>
                  Adicionado por <strong>{expense.payer}</strong> em{' '}
                  <strong>{formatDate(expense.date, 'short')}</strong>
                </p>
                <p className={styles.participants}>Dividido entre {expense.participants} pessoas</p>
              </div>
              <div className={styles.expenseActions}>
                <Link href={`/dashboard/expenses/${expense.id}`}>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  Deletar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
