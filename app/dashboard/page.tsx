// app/dashboard/page.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import styles from './page.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <h2>Bem-vindo ao Divvy!</h2>
        <p>Gerencie suas despesas compartilhadas com facilidade</p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <Card>
          <div className={styles.stat}>
            <h3>Suas Divvies</h3>
            <p className={styles.statValue}>3</p>
            <p className={styles.statLabel}>Grupos ativos</p>
          </div>
        </Card>

        <Card>
          <div className={styles.stat}>
            <h3>Despesas</h3>
            <p className={styles.statValue}>15</p>
            <p className={styles.statLabel}>Despesas registradas</p>
          </div>
        </Card>

        <Card>
          <div className={styles.stat}>
            <h3>Seu Saldo</h3>
            <p className={`${styles.statValue} ${styles.balance}`}>-R$ 245,50</p>
            <p className={styles.statLabel}>Você deve pagar</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3>Ações Rápidas</h3>
        <div className={styles.actionsGrid}>
          <Link href="/dashboard/create-divvy" className={styles.actionCard}>
            <span className={styles.actionIcon}></span>
            <h4>Criar Nova Divvy</h4>
            <p>Comece um novo grupo de despesas</p>
          </Link>

          <Link href="/dashboard/expenses/create" className={styles.actionCard}>
            <span className={styles.actionIcon}></span>
            <h4>Adicionar Despesa</h4>
            <p>Registre uma nova despesa</p>
          </Link>

          <Link href="/dashboard/balances" className={styles.actionCard}>
            <span className={styles.actionIcon}></span>
            <h4>Ver Saldos</h4>
            <p>Confira quem deve para quem</p>
          </Link>

          <Link href="/dashboard/divvies" className={styles.actionCard}>
            <span className={styles.actionIcon}></span>
            <h4>Minhas Divvies</h4>
            <p>Gerencie seus grupos</p>
          </Link>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h3>Despesas Recentes</h3>
          <Link href="/dashboard/expenses">
            <Button variant="outline" size="sm">
              Ver Tudo
            </Button>
          </Link>
        </div>

        <div className={styles.expensesList}>
          <div className={styles.expenseItem}>
            <span className={styles.expenseIcon}></span>
            <div className={styles.expenseInfo}>
              <p className={styles.expenseName}>Jantar no restaurante</p>
              <p className={styles.expenseDate}>Hoje</p>
            </div>
            <p className={styles.expenseAmount}>R$ 125,00</p>
          </div>

          <div className={styles.expenseItem}>
            <span className={styles.expenseIcon}></span>
            <div className={styles.expenseInfo}>
              <p className={styles.expenseName}>Hospedagem Hotel</p>
              <p className={styles.expenseDate}>Ontem</p>
            </div>
            <p className={styles.expenseAmount}>R$ 500,00</p>
          </div>

          <div className={styles.expenseItem}>
            <span className={styles.expenseIcon}></span>
            <div className={styles.expenseInfo}>
              <p className={styles.expenseName}>Uber para passeio</p>
              <p className={styles.expenseDate}>2 dias atrás</p>
            </div>
            <p className={styles.expenseAmount}>R$ 45,00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
