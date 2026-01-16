'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import styles from './page.module.css';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  payer: string;
  category: string;
  date: string;
  participants: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    // TODO: Substituir por dados reais da API
    {
      id: '1',
      description: 'Hospedagem Hotel',
      amount: 50000,
      payer: 'João Silva',
      category: 'accommodation',
      date: '2026-01-14',
      participants: 3,
    },
    {
      id: '2',
      description: 'Jantar no restaurante',
      amount: 15000,
      payer: 'Maria Santos',
      category: 'food',
      date: '2026-01-13',
      participants: 2,
    },
  ]);

  const [selectedDivvy, setSelectedDivvy] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categoryIcons: Record<string, string> = {
    food: '🍽️',
    transport: '🚗',
    accommodation: '🏨',
    entertainment: '🎉',
    other: '📝',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Despesas</h1>
        <Link href="/dashboard/expenses/create">
          <Button variant="primary" size="md">
            + Nova Despesa
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={selectedDivvy}
          onChange={(e) => setSelectedDivvy(e.target.value)}
          className={styles.select}
        >
          <option value="all">Todas as Divvies</option>
          <option value="1">Viagem RJ</option>
          <option value="2">Casa</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={styles.select}
        >
          <option value="all">Todas as Categorias</option>
          <option value="food"> Comida</option>
          <option value="transport"> Transporte</option>
          <option value="accommodation"> Hospedagem</option>
          <option value="entertainment"> Entretenimento</option>
          <option value="other"> Outro</option>
        </select>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}></p>
            <h3>Nenhuma despesa registrada</h3>
            <p>Comece a adicionar despesas para rastrear gastos</p>
            <Link href="/dashboard/expenses/create">
              <Button variant="primary" size="md">
                + Adicionar Despesa
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className={styles.expensesList}>
          {expenses.map((expense) => (
            <div key={expense.id} className={styles.expenseCard}>
              <div className={styles.expenseIcon}>
                {categoryIcons[expense.category] || ''}
              </div>
              <div className={styles.expenseDetails}>
                <div className={styles.expenseHeader}>
                  <h3>{expense.description}</h3>
                  <span className={styles.amount}>
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                <p className={styles.expenseMeta}>
                  Adicionado por <strong>{expense.payer}</strong> em{' '}
                  <strong>{formatDate(expense.date, 'short')}</strong>
                </p>
                <p className={styles.participants}>
                  Dividido entre {expense.participants} pessoas
                </p>
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
