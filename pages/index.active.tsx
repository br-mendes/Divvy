import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import LogoAnimated from '../components/common/LogoAnimated';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (err) {
      console.error('Erro ao verificar usuário:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <LogoAnimated />

          <div className="flex items-center gap-3 flex-nowrap">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" className="whitespace-nowrap h-11">Ir ao Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="whitespace-nowrap h-11">Entrar</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" className="whitespace-nowrap h-11">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-[#208085]/10 px-4 py-2 rounded-full">
              <span className="text-[#208085] font-semibold text-sm">
                 Divisão de Gastos Facilitada
              </span>
            </div>

            {/* TÍTULO EM 1 LINHA - RESPONSIVO */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:whitespace-nowrap font-bold text-gray-900 leading-tight">
              Despesas em grupo <span className="text-[#208085]">sem drama</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              Organize despesas compartilhadas com amigos, família ou república.
              Calcule automaticamente quem deve quem. Sem burocracia.
            </p>

            {/* BOTÕES NA MESMA LINHA */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={user ? '/dashboard' : '/auth/signup'}>
                <Button variant="primary" size="lg" className="whitespace-nowrap">
                  {user ? 'Começar Agora' : 'Criar Conta Grátis'} →
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="whitespace-nowrap">
                  Saiba Mais
                </Button>
              </a>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="bg-gradient-to-br from-[#208085]/20 to-purple-200/20 rounded-3xl w-full h-96 flex items-center justify-center">
              <div className="text-8xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Ferramentas poderosas e simples para gerenciar despesas
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: '',
                title: 'Registre Despesas',
                description: 'Adicione despesas com categoria, data e descrição. Automático e rápido.',
              },
              {
                icon: '',
                title: 'Calcule Saldos',
                description: 'Saiba automaticamente quem deve quem. Sem matemática confusa.',
              },
              {
                icon: '',
                title: 'Convide Membros',
                description: 'Compartilhe com link ou QR code. Eles recebem email com convite.',
              },
              {
                icon: '',
                title: 'Visualize Gráficos',
                description: 'Veja despesas por categoria e por pessoa com gráficos intuitivos.',
              },
              {
                icon: '',
                title: 'Divida Flexível',
                description: 'Divida igualmente, por shares ou valores customizados.',
              },
              {
                icon: '',
                title: 'Marque Pagamentos',
                description: 'Registre quando alguém pagou. Acompanhe histórico completo.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section - 4 CARDS */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '', title: 'Viagens', desc: 'Hotel, carro, refeições' },
              { emoji: '', title: 'República', desc: 'Aluguel, contas, compras' },
              { emoji: '', title: 'Casal', desc: 'Refeições, eventos' },
              { emoji: '', title: 'Eventos', desc: 'Festas, encontros' },
            ].map((useCase, idx) => (
              <div
                key={idx}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 text-center"
              >
                <div className="text-5xl mb-3">{useCase.emoji}</div>
                <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-[#208085] to-purple-600 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Grátis. Sem cartão de crédito. Sem complicações.
          </p>
          <Link href={user ? '/dashboard' : '/auth/signup'}>
            <Button variant="primary" size="lg" className="bg-white text-[#208085] hover:bg-gray-100">
              {user ? 'Ir ao Dashboard' : 'Criar Conta Agora'} →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl"></span>
                <span className="font-bold">Divvy</span>
              </div>
              <p className="text-gray-400 text-sm">
                Despesas em grupo sem drama
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white">Features</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">Sobre</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white">Privacidade</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">Termos</Link>
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
