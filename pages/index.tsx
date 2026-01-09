import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import DivvyLogo from '../components/branding/DivvyLogo';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedTagline from '../components/home/AnimatedTagline';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DivvyLogo className="w-8 h-8" animated={false} />
            <span className="text-2xl font-bold text-gray-900">Divvy</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="primary">Ir ao Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-6">
            <div className="inline-block bg-brand-50 px-4 py-2 rounded-full">
              <span className="text-brand-600 font-semibold text-sm">
                ✨ Divisão de Gastos Facilitada
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              <AnimatedTagline />
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Organize despesas compartilhadas com amigos, família ou república.
              Calcule automaticamente quem deve quem. Sem burocracia.
            </p>

            <div className="flex gap-4 pt-4">
              <Link href={user ? '/dashboard' : '/signup'}>
                <Button variant="primary" size="lg">
                  {user ? 'Começar Agora' : 'Criar Conta Grátis'} →
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Saiba Mais
                </Button>
              </a>
            </div>
          </div>

          {/* Right - Illustration */}
          <div className="hidden md:flex justify-center">
            <div className="bg-gradient-to-br from-brand-600/20 to-purple-200/20 rounded-3xl w-full h-96 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
               <DivvyLogo className="w-56 h-56 relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-gray-600">
              Ferramentas poderosas e simples para gerenciar despesas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📝',
                title: 'Registre Despesas',
                description:
                  'Adicione despesas com categoria, data e descrição. Automático e rápido.',
              },
              {
                icon: '⚖️',
                title: 'Calcule Saldos',
                description:
                  'Saiba automaticamente quem deve quem. Sem matemática confusa.',
              },
              {
                icon: '👥',
                title: 'Convide Membros',
                description:
                  'Compartilhe com link ou QR code. Eles recebem email com convite.',
              },
              {
                icon: '📊',
                title: 'Visualize Gráficos',
                description:
                  'Veja despesas por categoria e por pessoa com gráficos intuitivos.',
              },
              {
                icon: '💳',
                title: 'Divisão Flexível',
                description:
                  'Divida igualmente, por porcentagens ou valores customizados.',
              },
              {
                icon: '✅',
                title: 'Marque Pagamentos',
                description:
                  'Registre quando alguém pagou. Acompanhe histórico completo.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfeito para qualquer situação
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '✈️', title: 'Viagens', desc: 'Hotel, carro, refeições' },
              {
                emoji: '🏠',
                title: 'República',
                desc: 'Aluguel, contas, compras',
              },
              { emoji: '💜', title: 'Casal', desc: 'Refeições, eventos' },
              { emoji: '🎉', title: 'Eventos', desc: 'Festas, encontros' },
            ].map((useCase, idx) => (
              <div
                key={idx}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 text-center hover:shadow-md transition"
              >
                <div className="text-5xl mb-3">{useCase.emoji}</div>
                <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Grátis. Sem cartão de crédito. Sem complicações.
          </p>

          <Link href={user ? '/dashboard' : '/signup'}>
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-brand-600 hover:bg-gray-100 border-none"
            >
              {user ? 'Ir ao Dashboard' : 'Criar Conta Agora'} →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <DivvyLogo className="w-8 h-8" animated={false} />
                <span className="font-bold text-xl">Divvy</span>
              </div>
              <p className="text-gray-400 text-sm">
                Despesas em grupo sem drama
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 Divvy. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}