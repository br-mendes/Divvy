import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Moon, Sun, X } from 'lucide-react';
import DivvyLogo from '../branding/DivvyLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

interface StaticPageLayoutProps {
  children: React.ReactNode;
}

export default function StaticPageLayout({ children }: StaticPageLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 font-body">
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-dark-700 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <DivvyLogo className="w-8 h-8 transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-md" />
            <span className="text-xl font-display font-bold tracking-tight">Divvy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Sobre</Link>
            <Link href="/faq" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">FAQ</Link>
            <Link href="/privacy" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacidade</Link>
            <Link href="/terms" className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Termos</Link>
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-full transition-all">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!loading && user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="whitespace-nowrap">Dashboard</Button>
                </Link>
                <Button variant="primary" className="whitespace-nowrap" onClick={() => signOut()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="whitespace-nowrap">Entrar</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" className="whitespace-nowrap">Criar Conta</Button>
                </Link>
              </>
            )}
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-dark-700 p-6 bg-white dark:bg-dark-900 flex flex-col gap-4 animate-fade-in-down shadow-xl">
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 dark:text-gray-300">Sobre</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 dark:text-gray-300">FAQ</Link>
            <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 dark:text-gray-300">Privacidade</Link>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 dark:text-gray-300">Termos</Link>
            {!loading && user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" fullWidth>Dashboard</Button></Link>
                <Button variant="primary" fullWidth onClick={() => { setMobileMenuOpen(false); signOut(); }}>Logout</Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" fullWidth>Entrar</Button></Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}><Button variant="primary" fullWidth>Criar Conta</Button></Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {children}
      </main>

      <footer className="py-12 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DivvyLogo className="w-6 h-6" animated={false} />
              <span className="font-display font-bold text-lg">Divvy</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
              Gestão inteligente de despesas para roommates, viagens e grupos.
            </p>
            <div className="mt-4">
              <Link href="/auth/signup">
                <Button variant="primary" size="sm" className="whitespace-nowrap">
                  Criar Conta Agora →
                </Button>
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Produto</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/faq" className="hover:text-brand-600 transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600 transition-colors">Contato</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Empresa</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-brand-600 transition-colors">Sobre</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacidade</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600 transition-colors">Termos</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <p className="mt-10 text-xs text-gray-400">© 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
