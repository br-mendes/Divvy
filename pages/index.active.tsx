
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import AnimatedTagline from '../components/home/AnimatedTagline';
import Link from 'next/link';
import DivvyLogo from '../components/branding/DivvyLogo';
import { Moon, Sun, Menu, X } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header Responsivo */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-dark-700 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <DivvyLogo className="w-8 h-8 group-hover:scale-110 transition-transform" animated={false} />
            <span className="text-xl font-bold tracking-tight">Divvy</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link href="/login"><Button variant="outline">Entrar</Button></Link>
            <Link href="/signup"><Button variant="primary">Criar Conta</Button></Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 rounded-full">
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
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
          <div className="md:hidden border-t border-gray-100 dark:border-dark-700 p-6 bg-white dark:bg-dark-900 flex flex-col gap-4 animate-fade-in-down shadow-2xl">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" fullWidth>Entrar</Button></Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}><Button variant="primary" fullWidth>Criar Conta Grátis</Button></Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-full border border-brand-100 dark:border-brand-800/50">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
              <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm">Organização sem climão</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <AnimatedTagline />
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Gerencie despesas de viagens, repúblicas e eventos. O Divvy faz os cálculos para você focar no que importa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link href="/signup" className="w-full sm:w-auto"><Button variant="primary" size="lg" className="w-full sm:px-12 h-14 text-lg">Começar Agora</Button></Link>
              <Link href="#features" className="w-full sm:w-auto"><Button variant="outline" size="lg" className="w-full h-14 text-lg">Como Funciona?</Button></Link>
            </div>
          </div>
          
          <div className="relative flex justify-center lg:justify-end animate-float">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl -z-10"></div>
            <div className="relative bg-white dark:bg-dark-800 p-12 sm:p-16 rounded-[40px] shadow-2xl border border-gray-100 dark:border-dark-700">
              <DivvyLogo className="w-40 h-40 sm:w-64 sm:h-64" />
            </div>
          </div>
        </div>
      </section>

      {/* Features com Grid Adaptativo */}
      <section id="features" className="bg-gray-50/50 dark:bg-dark-900/50 py-20 border-y border-gray-100 dark:border-dark-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo sob controle</h2>
            <p className="text-gray-600 dark:text-gray-400">Ferramentas desenhadas para simplificar sua vida financeira em grupo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: '📊', title: 'Relatórios Claros', desc: 'Visualize para onde vai o dinheiro com gráficos automáticos.' },
              { icon: '💳', title: 'Pagamentos Pix', description: 'Chaves Pix de todos os membros centralizadas para facilitar.' },
              { icon: '🔒', title: 'Histórico Seguro', description: 'Registro completo de quem pagou o quê e quando.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">{feature.desc || feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-gray-100 dark:border-dark-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <DivvyLogo className="w-6 h-6" animated={false} />
            <span className="font-bold">Divvy</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">© 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
