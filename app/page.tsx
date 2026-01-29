'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/common/Button';
import LogoAnimated from '@/components/common/LogoAnimated';
import AnimatedTagline from '@/components/home/AnimatedTagline';
import HeroVideo from '@/components/home/HeroVideo';
import StaticPageLinks from '@/components/common/StaticPageLinks';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <LogoAnimated />
          <div className="flex gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-purple-100 px-3 py-1 rounded-full text-purple-700 text-sm font-semibold">
              Gestão inteligente de despesas
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              <AnimatedTagline />
            </h1>
            <p className="text-xl text-gray-600">
              Viagens, repúblicas ou jantares. O Divvy calcula quem deve quem para que
              você não precise se preocupar.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href={user ? '/dashboard' : '/auth/signup'}>
                <Button size="lg">{user ? 'Ir para Dashboard' : 'Começar Agora'}</Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Saiba Mais
                </Button>
              </a>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <HeroVideo />
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Ferramentas poderosas para gerenciar despesas em grupo
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: '🧾', title: 'Registre Despesas', desc: 'Adicione gastos com categoria e descrição' },
              { icon: '⚖️', title: 'Calcule Saldos', desc: 'Saiba automaticamente quem deve quem' },
              { icon: '📨', title: 'Convide Membros', desc: 'Convide amigos usando o e-mail cadastrado' },
              { icon: '📊', title: 'Visualize Gráficos', desc: 'Veja despesas em tempo real' },
              { icon: '🧮', title: 'Divida Flexível', desc: 'Divisão igualitária automática (Customizável em breve)' },
              { icon: '✅', title: 'Marque Pagamentos', desc: 'Controle total do fluxo de caixa do grupo' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">© 2026 Divvy. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center">
            <StaticPageLinks className="text-gray-300" />
          </div>
        </div>
      </footer>
    </div>
  );
}
