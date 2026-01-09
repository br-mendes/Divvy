import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Button from '../components/common/Button';
import AnimatedTagline from '../components/home/AnimatedTagline';
import Link from 'next/link';
import DivvyLogo from '../components/branding/DivvyLogo';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Se o usuário já está logado (comum após redirecionamento OAuth), manda direto pro dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Erro ao verificar usuário:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center min-h-[60px] sm:min-h-[70px]">
          <Link href="/" className="flex items-center gap-2">
            <DivvyLogo className="w-8 h-8" animated={false} />
            <span className="text-xl font-bold text-gray-900">Divvy</span>
          </Link>
          
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary">Dashboard</Button>
              </Link>
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

          <button
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 p-4 bg-white space-y-3 animate-fade-in-down">
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>
                    Entrar
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 order-2 md:order-1 text-center md:text-left">
            <div className="inline-block bg-primary/10 px-3 sm:px-4 py-2 rounded-full">
              <span className="text-primary font-semibold text-xs sm:text-sm">
                ✨ Divisão de Gastos Facilitada
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight">
              <AnimatedTagline />
            </h1>
            <p className="text-base sm:text-xl text-gray-600 leading-relaxed max-w-lg mx-auto md:mx-0">
              Organize despesas compartilhadas com amigos, família ou república de forma automática e justa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
              <Link href={user ? '/dashboard' : '/signup'} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth>
                  {user ? 'Acessar Dashboard' : 'Criar Conta Grátis'}
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth>
                  Saiba Mais
                </Button>
              </a>
            </div>
          </div>
          <div className="flex justify-center order-1 md:order-2">
            <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping-slow"></div>
              <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center">
                <DivvyLogo className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-dark mb-2 sm:mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-base sm:text-xl text-gray-600">
              Ferramentas poderosas para manter as contas em dia
            </p>
          </div>
          <div className="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: '📝', title: 'Registre Despesas', description: 'Adicione despesas rapidamente e anexe detalhes.' },
              { icon: '⚖️', title: 'Calcule Saldos', description: 'Saiba exatamente quem deve quem sem planilhas.' },
              { icon: '👥', title: 'Convide Membros', description: 'Compartilhe grupos facilmente via link ou QR Code.' },
              { icon: '📊', title: 'Análise de Gastos', description: 'Visualize seus gastos por categoria com gráficos claros.' },
              { icon: '💳', title: 'Divisão Flexível', description: 'Divida igualmente ou por valores customizados.' },
              { icon: '✅', title: 'Histórico Completo', description: 'Mantenha um registro transparente de todos os pagamentos.' },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="text-3xl sm:text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-dark mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <DivvyLogo className="w-8 h-8" animated={false} />
            <span className="text-2xl font-bold">Divvy</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}