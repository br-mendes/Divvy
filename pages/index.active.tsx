
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
        <div className="h-12 w-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
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
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}><Button variant="primary" fullWidth>Criar Conta</Button></Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-20 sm:pt-20 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <AnimatedTagline />
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Uma aplicação inteligente de partilha de despesas para colegas de casa, viagens e grupos. 
              Gira despesas partilhadas, visualize saldos e entenda seus hábitos de consumo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:px-10">Começar Agora</Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:px-10">Saiba Mais</Button>
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center animate-float">
            <div className="relative bg-white dark:bg-dark-800 p-12 rounded-[40px] shadow-2xl border border-gray-100 dark:border-dark-700">
              <DivvyLogo className="w-64 h-64" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50/50 dark:bg-dark-900/50 py-24 border-y border-gray-100 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Controle Inteligente de Gastos</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg italic">"A maneira mais simples de dividir contas sem climão."</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-2xl mb-6">🏘️</div>
              <h3 className="text-xl font-bold mb-3">Gestão de Grupos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Perfeito para repúblicas, viagens em grupo ou eventos. Mantenha todos na mesma página.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-2xl mb-6">⚖️</div>
              <h3 className="text-xl font-bold mb-3">Saldos em Tempo Real</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Saiba exatamente quem deve para quem. O sistema calcula automaticamente o menor número de transações.
              </p>
            </div>
            <div className="p-8 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-2xl mb-6">📈</div>
              <h3 className="text-xl font-bold mb-3">Hábitos de Consumo</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Visualize seus gastos por categorias e entenda para onde está indo o dinheiro do grupo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-gray-100 dark:border-dark-700 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">© 2026 Divvy. Gestão inteligente de despesas.</p>
      </footer>
    </div>
  );
}
