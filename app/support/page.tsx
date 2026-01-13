"use client";

import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { MessageSquare, Mail, Send } from 'lucide-react';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao enviar mensagem');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      toast.success('Mensagem enviada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <MessageSquare className="text-brand-600" />
          Central de Suporte
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Tem alguma dúvida ou encontrou um problema? Entre em contato conosco.
        </p>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-200">
              <Send size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mensagem Recebida!</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Obrigado por entrar em contato. Nossa equipe responderá em breve através do email fornecido.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setSuccess(false)}>
              Enviar outra mensagem
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
                <Input
                  label="Email *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <Input
                label="Assunto *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Ex: Problema com login"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Descreva seu problema ou dúvida em detalhes..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <Button type="submit" fullWidth isLoading={loading} className="h-12 text-lg">
                Enviar Mensagem
              </Button>
            </form>
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Contato Direto</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Prefere enviar um email diretamente?
            </p>
            <a href="mailto:falecomdivvy@gmail.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              falecomdivvy@gmail.com
            </a>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">FAQ</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Sua dúvida pode já ter sido respondida.
            </p>
            <a href="/faq" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
              Ver Perguntas Frequentes
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
