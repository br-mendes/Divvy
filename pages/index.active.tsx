
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/common/Button';
import AnimatedTagline from '../components/home/AnimatedTagline';
import Link from 'next/link';
import DivvyLogo from '../components/branding/DivvyLogo';
import { Moon, Sun, Menu, X, ArrowRight, ShieldCheck, PieChart, Users, DollarSign, Calculator, Send, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-950 transition-colors">
        <div className="h-10 w-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans selection:bg-brand-500/30">
      {/* Navbar Otimizada */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-dark-700 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <DivvyLogo className="w-8 h-8 group-hover:scale-110 transition-transform" animated={false} />
            <span className="text-xl font-bold tracking-tight">Divvy</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Recursos</Link>
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Entrar</Link>
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-all">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/signup">
              <Button variant="primary" className="shadow-lg shadow-brand-500/20 px-6">Criar Conta</Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 rounded-full">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-dark-700 p-6 bg-white dark:bg-dark-900 flex flex-col gap-4 animate-fade-in-down shadow-xl">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" fullWidth>Entrar</Button></Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}><Button variant="primary" fullWidth>Criar Conta Grátis</Button></Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
              ✨ Gestão inteligente de despesas
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <AnimatedTagline />
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Organize despesas compartilhadas com amigos, família ou república. Calcule automaticamente quem deve quem, sem burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:px-12 group shadow-xl shadow-brand-500/20 hover:scale-[1.02] transition-transform">
                  Começar Agora
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:px-12 dark:bg-dark-800/50">Saiba Mais</Button>
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center relative">
            <div className="absolute -inset-10 bg-brand-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="relative bg-white dark:bg-dark-800 p-20 rounded-[64px] shadow-2xl border border-gray-100 dark:border-dark-700 animate-float transition-colors duration-500">
              <DivvyLogo className="w-64 h-64 relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="bg-gray-50/50 dark:bg-dark-900/40 py-24 border-y border-gray-100 dark:border-dark-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Tudo que você precisa</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Ferramentas poderosas e simples para gerenciar despesas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<DollarSign size={28} />}
              title="Registre Despesas"
              desc="Adicione despesas com categoria, data e descrição. Automático e rápido."
            />
            <FeatureCard 
              icon={<Calculator size={28} />}
              title="Calcule Saldos"
              desc="Saiba automaticamente quem deve a quem. Sem matemática confusa."
            />
             <FeatureCard 
              icon={<Send size={28} />}
              title="Convide Membros"
              desc="Compartilhe com link ou QR code. Eles recebem e-mail com convite."
            />
             <FeatureCard 
              icon={<PieChart size={28} />}
              title="Visualize Gráficos"
              desc="Veja despesas por categoria e por pessoa com gráficos intuitivos."
            />
            <FeatureCard 
              icon={<Users size={28} />}
              title="Divisão Flexível"
              desc="Divida igualmente, por porcentagens ou valores customizados."
            />
             <FeatureCard 
              icon={<CheckCircle size={28} />}
              title="Marque Pagamentos"
              desc="Registre quando alguém pagou. Acompanhe histórico completo."
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid md:grid-cols-4 gap-6">
              {[
                { emoji: '✈️', title: 'Viagens', desc: 'Hotel, carro, refeições' },
                { emoji: '🏠', title: 'República', desc: 'Aluguel, contas, compras' },
                { emoji: '👫', title: 'Casal', desc: 'Refeições, eventos' },
                { emoji: '🎉', title: 'Eventos', desc: 'Festas, encontros' },
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-gradient-to-br from-gray-50 dark:from-dark-800 to-white dark:to-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700 text-center">
                   <div className="text-5xl mb-4">{item.emoji}</div>
                   <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                   <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <DivvyLogo className="w-6 h-6" animated={false} />
            <span className="font-bold text-lg">Divvy</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Gestão inteligente de despesas para roommates, viagens e grupos.</p>
          <div className="flex gap-6 text-sm text-gray-400 font-medium">
             <Link href="#" className="hover:text-brand-600 transition-colors">Termos</Link>
             <Link href="#" className="hover:text-brand-600 transition-colors">Privacidade</Link>
             <Link href="#" className="hover:text-brand-600 transition-colors">Contato</Link>
          </div>
          <p className="mt-12 text-xs text-gray-400">© 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group p-8 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-300">
      <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  );
}
