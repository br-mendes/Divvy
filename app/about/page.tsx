'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/common/Button';

const team = [
  {
    name: 'João Silva',
    role: 'Founder & Full-Stack',
    avatar: '',
    bio: 'Desenvolvedor experiente em SaaS com foco em fintech.',
  },
  {
    name: 'Maria Santos',
    role: 'Product Manager',
    avatar: '',
    bio: 'Apaixonada por resolver problemas reais com tecnologia.',
  },
  {
    name: 'Pedro Costa',
    role: 'Design Lead',
    avatar: '',
    bio: 'Criador de interfaces intuitivas e acessíveis.',
  },
];

const values = [
  {
    icon: '',
    title: 'Simplicidade',
    description:
      'Dividir despesas não deve ser complicado. Interface clara e intuitiva.',
  },
  {
    icon: '',
    title: 'Segurança',
    description:
      'Seus dados financeiros são criptografados e nunca compartilhados.',
  },
  {
    icon: '',
    title: 'Inovação',
    description:
      'Constantemente melhorando com base no feedback dos usuários.',
  },
  {
    icon: '',
    title: 'Acessibilidade',
    description: 'Disponível em múltiplas línguas e dispositivos.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center min-h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl"></span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Divvy
            </span>
          </Link>
          <nav className="hidden sm:flex gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              Home
            </Link>
            <Link
              href="/faq"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              FAQ
            </Link>
            <Link
              href="/support"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              Suporte
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Sobre o Divvy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        >
          Somos uma equipe apaixonada por resolver o problema real de dividir
          despesas compartilhadas de forma justa e transparente.
        </motion.p>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Nossa Missão
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Simplificar a divisão de despesas compartilhadas, eliminando
              confusão e atritos financeiros entre amigos, famílias e colegas.
              Queremos que todos tenham clareza total sobre quem deve a quem.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Nossa Visão
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Ser a aplicação padrão global para dividir despesas compartilhadas.
              Uma plataforma onde a confiança é construída sobre transparência e
              segurança, e onde ninguém precisa se preocupar com contas mal
              calculadas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Nossos Valores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center shadow-sm"
            >
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Nosso Time
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {team.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-md text-center"
            >
              <div className="text-6xl mb-4">{member.avatar}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {member.name}
              </h3>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                {member.role}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {member.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Quer Fazer Parte da Nossa Jornada?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Junte-se a milhares de usuários que confiam no Divvy.
          </p>
          <Link href="/auth/signup">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Começar Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
