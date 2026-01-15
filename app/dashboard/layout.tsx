// app/dashboard/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/common/Button';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.logoLink}>
            <Logo size="sm" animated={false} />
          </Link>

          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/dashboard/divvies" className={styles.navLink}>
              Minhas Divvies
            </Link>
            <Link href="/dashboard/expenses" className={styles.navLink}>
              Despesas
            </Link>
            <Link href="/dashboard/balances" className={styles.navLink}>
              Saldos
            </Link>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}></div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user.email}</p>
              <p className={styles.userEmail}>Perfil</p>
            </div>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <div className={styles.headerActions}>
            <Link href="/dashboard/create-divvy">
              <Button variant="primary" size="md">
                + Nova Divvy
              </Button>
            </Link>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
