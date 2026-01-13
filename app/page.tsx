'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/common/Button';
import ThemeToggle from '@/components/common/ThemeToggle';
import supabase from '@/lib/supabase';

const features = [
  {
    icon: '',
    title: 'Registre Despesas',
    description:
      'Adicione despesas com categoria, data e descrição. Automático e rápido.',
  },
  {
    icon: '',
    title: 'Calcule Saldos',
    description: 'Saiba automaticamente quem deve quem. Sem matemática confusa.',
  },
  {
    icon: '',
    title: 'Convide Membros',
    description:
      'Compartilhe com link ou QR code. Eles recebem e-mail com convite.',
  },
  {
    icon: '',
    title: 'Visualize Gráficos',
    description:
      'Veja despesas por categoria e por pessoa com gráficos intuitivos.',
  },
  {
    icon: '',
    title: 'Divisão Flexível',
    description: 'Divida igualmente, por porcentagens ou valores customizados.',
  },
  {
    icon: '',
    title: 'Marque Pagamentos',
    description: 'Registre quando alguém pagou. Acompanhe histórico completo.',
  },
];

const usecases = [
  { emoji: '', title: 'Viagens', desc: 'Hotel, carro, refeições' },
  { emoji: '', title: 'República', desc: 'Aluguel, contas, compras' },
  { emoji: '', title: 'Casal', desc: 'Refeições, eventos' },
  { emoji: '', title: 'Eventos', desc: 'Festas, encontros' },
];

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error('Erro ao verificar usuário', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center min-h-[60px] sm:min-h-[70px]">
          <div className="flex items-center gap-2">
            <span className="text-2xl"></span>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
              Divvy
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary">Ir ao Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                Menu
              </span>
              <ThemeToggle />
            </div>
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  Ir ao Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>
                    Entrar
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Divida Despesas de Forma Justa
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Organize suas contas compartilhadas com simplicidade. Sem confusão,
            sem atritos. Transparência total em cada transação.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button variant="primary" size="lg">
                  Começar Grátis
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Saiba Mais
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                Abrir Dashboard
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Para Qualquer Situação
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {usecases.map((usecase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-2">{usecase.emoji}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {usecase.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {usecase.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Recursos Poderosos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-slate-700"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto">
              Crie sua conta agora e comece a dividir despesas com seus amigos e
              família.
            </p>
            <Link href="/auth/signup">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Produto
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-blue-600">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-blue-600">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Suporte
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/support" className="hover:text-blue-600">
                    Contato
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@divvy.app"
                    className="hover:text-blue-600"
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-blue-600">
                    Termos
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-blue-600">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Social
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="https://twitter.com" className="hover:text-blue-600">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://github.com" className="hover:text-blue-600">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <p>&copy; 2026 Divvy. Todos os direitos reservados.</p>
              <p>Feito com no Brasil</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
