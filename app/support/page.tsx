'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/common/Button';

const supportCategories = [
  {
    icon: '',
    title: 'Precisa de Ajuda?',
    description: 'Confira nossa base de conhecimento',
    action: 'Ver FAQ',
    href: '/faq',
  },
  {
    icon: '',
    title: 'Reportar Bug',
    description: 'Encontrou um problema? Avise-nos',
    action: 'Reportar',
    href: '#contact',
  },
  {
    icon: '',
    title: 'Sugestão de Recurso',
    description: 'Tem uma ideia? Gostaríamos de ouvir',
    action: 'Sugerir',
    href: '#contact',
  },
  {
    icon: '',
    title: 'Contato Direto',
    description: 'Email de suporte disponível 24/7',
    action: 'Email',
    href: 'mailto:support@divvy.app',
  },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'bug',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Mensagem enviada! Obrigado pelo contato.');
        setFormData({
          name: '',
          email: '',
          category: 'bug',
          subject: '',
          message: '',
        });
      } else {
        toast.error('Erro ao enviar. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center min-h-[60px]">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl"></span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Divvy
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Centro de Suporte
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Estamos aqui para ajudar. Escolha a opção abaixo.
          </p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {supportCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <a
                href={cat.href}
                className="block bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {cat.description}
                </p>
                <span className="text-blue-600 hover:underline text-sm font-semibold">
                  {cat.action} →
                </span>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div
          id="contact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Envie uma Mensagem
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Seu Nome
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Seu Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Categoria
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="question">Pergunta</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Resumo do assunto"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Mensagem
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descreva seu problema ou sugestão em detalhes..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="primary" type="submit" disabled={loading} fullWidth>
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Response Time Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Respondemos a todas as mensagens em até <strong>24 horas</strong> nos
            dias úteis.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-center gap-6 mb-4 text-sm flex-wrap">
            <Link href="/faq" className="hover:text-blue-600">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-blue-600">
              Termos
            </Link>
            <Link href="/privacy" className="hover:text-blue-600">
              Privacidade
            </Link>
          </div>
          <p>&copy; 2026 Divvy. Todos os direitos reservados.</p>
          <p className="mt-2">support@divvy.app | Chat 24/7</p>
        </div>
      </footer>
    </div>
  );
}
