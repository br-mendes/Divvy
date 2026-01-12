
import React from 'react';
import Link from 'next/link';
import DivvyLogo from '../components/branding/DivvyLogo';
import { Button } from '../components/ui/Button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AboutPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-dark-700 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2">
            <DivvyLogo className="w-8 h-8" animated={false} />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Divvy</span>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 rounded-full">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link href="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            Sobre o Divvy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Simplificando a forma como grupos, amigos e famílias lidam com despesas compartilhadas.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nossa Missão</h2>
          <div className="bg-white dark:bg-dark-900 p-8 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              O Divvy nasceu da necessidade de eliminar o atrito financeiro nas relações sociais. 
              Seja em uma viagem dos sonhos, dividindo apartamento ou organizando um churrasco, 
              acreditamos que a parte financeira deve ser transparente, justa e, acima de tudo, simples.
              Nosso objetivo é garantir que você foque nas experiências e momentos, não nas planilhas.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Nossos Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🔒',
                title: 'Segurança',
                desc: 'Seus dados são criptografados e protegidos com os mais altos padrões de segurança.',
              },
              {
                emoji: '💡',
                title: 'Simplicidade',
                desc: 'Interface intuitiva que qualquer um pode usar. Sem complicações ou jargão técnico.',
              },
              {
                emoji: '✨',
                title: 'Transparência',
                desc: 'Todos veem os mesmos saldos. Sem surpresas, sem truques. Confiança total.',
              },
            ].map((value, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-100 dark:border-dark-800">
                <div className="text-4xl mb-4">{value.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tecnologia & Open Source</h2>
          <div className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-900 dark:to-dark-950 p-8 rounded-2xl border border-brand-100 dark:border-dark-800">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              O Divvy é construído com tecnologias modernas para garantir performance e escalabilidade.
              Somos defensores da transparência não apenas nas finanças, mas também no código.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> React / Next.js</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-teal-500 rounded-full"></span> Supabase</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sky-500 rounded-full"></span> Tailwind CSS</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> TypeScript</div>
            </div>
          </div>
        </section>

        <div className="mt-16 text-center">
          <Link href="/signup">
            <Button size="lg" className="px-8 shadow-xl shadow-brand-500/20">
              Começar a usar o Divvy
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100 dark:border-dark-700 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 AMX Solutions. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
