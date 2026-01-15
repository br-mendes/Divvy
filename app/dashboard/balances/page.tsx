'use client';

import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/utils/format';
import { formatBalance } from '@/utils/balanceCalculator';
import styles from './page.module.css';

interface BalanceTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: 'pending' | 'completed';
  description: string;
}

export default function BalancesPage() {
  const [transactions] = useState<BalanceTransaction[]>([
    // TODO: Substituir por dados reais da API
    {
      id: '1',
      from: 'Você',
      to: 'João Silva',
      amount: 15000,
      status: 'pending',
      description: 'Por hospedagem',
    },
    {
      id: '2',
      from: 'Maria Santos',
      to: 'Você',
      amount: 8500,
      status: 'completed',
      description: 'Por transporte',
    },
  ]);

  const [selectedDivvy, setSelectedDivvy] = useState<string>('all');

  const myBalance = 15000 - 8500;
  const youOwe = transactions
    .filter((transaction) => transaction.from === 'Você' && transaction.status === 'pending')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const youReceive = transactions
    .filter((transaction) => transaction.to === 'Você' && transaction.status === 'pending')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Saldos</h1>
        <select
          value={selectedDivvy}
          onChange={(event) => setSelectedDivvy(event.target.value)}
          className={styles.select}
        >
          <option value="all">Todas as Divvies</option>
          <option value="1">Viagem RJ</option>
          <option value="2">Casa</option>
        </select>
      </div>

      <div className={styles.summaryGrid}>
        <Card>
          <div className={styles.summaryCard}>
            <h3>Seu Saldo Geral</h3>
            <p className={`${styles.amount} ${myBalance >= 0 ? styles.receive : styles.owe}`}>
              {formatCurrency(Math.abs(myBalance))}
            </p>
            <p className={styles.status}>{formatBalance(myBalance)}</p>
          </div>
        </Card>

        <Card>
          <div className={styles.summaryCard}>
            <h3>Você Deve Pagar</h3>
            <p className={`${styles.amount} ${styles.owe}`}>
              {formatCurrency(youOwe)}
            </p>
            <p className={styles.status}>
              Em {transactions.filter((transaction) => transaction.from === 'Você').length} transações
            </p>
          </div>
        </Card>

        <Card>
          <div className={styles.summaryCard}>
            <h3>Você Deve Receber</h3>
            <p className={`${styles.amount} ${styles.receive}`}>
              {formatCurrency(youReceive)}
            </p>
            <p className={styles.status}>
              Em {transactions.filter((transaction) => transaction.to === 'Você').length} transações
            </p>
          </div>
        </Card>
      </div>

      <div className={styles.transactionsSection}>
        <h2>Transações Pendentes</h2>

        {transactions.filter((transaction) => transaction.status === 'pending').length === 0 ? (
          <Card>
            <div className={styles.emptyState}>
              <p>✓ Sem saldos pendentes!</p>
              <p className={styles.emptySubtext}>Todos os saldos foram acertados</p>
            </div>
          </Card>
        ) : (
          <div className={styles.transactionsList}>
            {transactions
              .filter((transaction) => transaction.status === 'pending')
              .map((transaction) => (
                <div key={transaction.id} className={styles.transactionCard}>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionHeader}>
                      <span className={styles.direction}>
                        {transaction.from === 'Você' ? 'Você paga' : 'Você recebe'}
                      </span>
                      <div className={styles.transactionDetails}>
                        <p className={styles.transactionText}>
                          {transaction.from === 'Você'
                            ? `Você deve ${formatCurrency(transaction.amount)} para ${transaction.to}`
                            : `${transaction.from} lhe deve ${formatCurrency(transaction.amount)}`}
                        </p>
                        <p className={styles.transactionSubtext}>{transaction.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.transactionActions}>
                    {transaction.from === 'Você' ? (
                      <Button variant="primary" size="sm">
                        Pagar
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm">
                        ✓ Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {transactions.filter((transaction) => transaction.status === 'completed').length > 0 && (
        <div className={styles.completedSection}>
          <h3>Histórico de Transações Acertadas</h3>
          <div className={styles.completedList}>
            {transactions
              .filter((transaction) => transaction.status === 'completed')
              .map((transaction) => (
                <div key={transaction.id} className={styles.completedItem}>
                  <span className={styles.completedIcon}>✓</span>
                  <p className={styles.completedText}>
                    {transaction.from === 'Você'
                      ? `Você pagou ${formatCurrency(transaction.amount)} para ${transaction.to}`
                      : `${transaction.from} lhe pagou ${formatCurrency(transaction.amount)}`}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
