'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/common/Button';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // TODO: Descomentar após implementar sistema de sessão
    // if (!isAuthenticated && !loading) {
    //   router.push('/login');
    // }
  }, [isAuthenticated, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Logo size="md" animated={false} />
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.navItem}>
            Dashboard
          </Link>
          <Link href="/dashboard/divvies" className={styles.navItem}>
            Minhas Divvies
          </Link>
          <Link href="/dashboard/create-divvy" className={styles.navItem}>
            Nova Divvy
          </Link>
          <Link href="/dashboard/expenses" className={styles.navItem}>
            Despesas
          </Link>
          <Link href="/dashboard/balances" className={styles.navItem}>
            Saldos
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user?.full_name?.charAt(0) || '?'}</div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user?.full_name || 'Usuário'}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" fullWidth onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <div className={styles.topBarRight}>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                Configurações
              </Button>
            </Link>
          </div>
        </header>

        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
