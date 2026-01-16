'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user } = useAuth();

  // TODO: Substituir por dados reais da API
  const quickStats = [
    {
      label: 'Divvies Ativas',
      value: '0',
      icon: '',
      color: 'primary',
    },
    {
      label: 'Você deve pagar',
      value: 'R$ 0,00',
      icon: '',
      color: 'danger',
    },
    {
      label: 'Deve receber',
      value: 'R$ 0,00',
      icon: '',
      color: 'secondary',
    },
    {
      label: 'Despesas este mês',
      value: '0',
      icon: '',
      color: 'info',
    },
  ];

  const recentDivvies = [
    // TODO: Substituir por dados reais
    {
      id: '1',
      name: 'Viagem RJ',
      type: 'Viagem',
      members: 3,
      totalAmount: 1500.00,
    },
  ];

  return (
    <div className={styles.container}>
      <section className={styles.welcomeSection}>
        <h2>Bem-vindo, {user?.full_name?.split(' ')[0]}! </h2>
        <p>Aqui está um resumo de suas Divvies</p>
      </section>

      {/* Quick Stats */}
      <section className={styles.statsSection}>
        <div className={styles.grid}>
          {quickStats.map((stat, index) => (
            <div key={index} className={`${styles.statCard} ${styles[stat.color]}`}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Divvies */}
      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h3>Minhas Divvies</h3>
          <Link href="/dashboard/divvies">
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </Link>
        </div>

        {recentDivvies.length === 0 ? (
          <Card>
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}></p>
              <h4>Nenhuma Divvy criada ainda</h4>
              <p>Crie sua primeira Divvy para começar a compartilhar despesas</p>
              <Link href="/dashboard/create-divvy">
                <Button variant="primary" size="md">
                   Criar Divvy
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className={styles.divviesList}>
            {recentDivvies.map((divvy) => (
              <Card
                key={divvy.id}
                title={divvy.name}
                description={`${divvy.members} membros • R$ ${divvy.totalAmount.toFixed(2)}`}
              >
                <Link href={`/dashboard/divvies/${divvy.id}`}>
                  <Button variant="outline" size="sm" fullWidth>
                    Gerenciar
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
