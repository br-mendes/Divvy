import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Logo } from '@/components/common/Logo';
import styles from './page.module.css';

const features = [
  {
    icon: '',
    title: 'Dividir Despesas',
    description: 'Divide as contas de forma justa entre todos os participantes.',
  },
  {
    icon: '',
    title: 'Histórico Detalhado',
    description: 'Acompanhe todas as transações e saldos em tempo real.',
  },
  {
    icon: '',
    title: 'Convites por Email',
    description: 'Convide amigos facilmente para sua Divvy.',
  },
  {
    icon: '',
    title: 'Seguro e Privado',
    description: 'Seus dados são protegidos com encriptação.',
  },
  {
    icon: '',
    title: 'Responsivo',
    description: 'Funciona perfeitamente em celular, tablet e desktop.',
  },
  {
    icon: '',
    title: 'Rápido e Simples',
    description: 'Interface intuitiva e fácil de usar.',
  },
];

const useCases = [
  {
    emoji: '',
    title: 'Viagens',
    description: 'Organize despesas de viagens em grupo',
  },
  {
    emoji: '',
    title: 'República',
    description: 'Controle contas compartilhadas da casa',
  },
  {
    emoji: '',
    title: 'Casal',
    description: 'Divida despesas com seu parceiro',
  },
  {
    emoji: '',
    title: 'Eventos',
    description: 'Organize festas e eventos coletivos',
  },
];

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Header/Navigation */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Logo size="md" animated={true} />
          <nav className={styles.nav}>
            <Link href="#features" className={styles.navLink}>
              Features
            </Link>
            <Link href="#usecases" className={styles.navLink}>
              Use Cases
            </Link>
            <Link href="#contact" className={styles.navLink}>
              Contato
            </Link>
          </nav>
          <div className={styles.authButtons}>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Cadastro
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Divida despesas de forma inteligente e justa
          </h1>
          <p className={styles.subtitle}>
            Organize seus gastos compartilhados com amigos, família ou colegas.
            Saiba exatamente quem deve para quem.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/signup">
              <Button variant="primary" size="lg">
                 Começar Agora
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                 Saiba Mais
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Recursos Principais</h2>
          <p>Tudo o que você precisa para gerenciar despesas compartilhadas</p>
        </div>
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <Card
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className={styles.useCasesSection}>
        <div className={styles.sectionHeader}>
          <h2>Para Qualquer Situação</h2>
          <p>Divvy funciona para diversos cenários de compartilhamento</p>
        </div>
        <div className={styles.useCasesGrid}>
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              icon={useCase.emoji}
              title={useCase.title}
              description={useCase.description}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2>Pronto para começar?</h2>
        <p>Crie sua conta agora e comece a dividir despesas</p>
        <Link href="/signup">
          <Button variant="primary" size="lg">
            Cadastrar Agora
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Logo size="sm" animated={false} />
          <nav className={styles.footerNav}>
            <Link href="/about">Sobre</Link>
            <Link href="/privacy">Privacidade</Link>
            <Link href="/terms">Termos</Link>
            <Link href="/contact">Contato</Link>
          </nav>
        </div>
        <p className={styles.copyright}>
          © 2026 Divvy. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
