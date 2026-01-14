import React from 'react';
import StaticPageLayout from '../components/layout/StaticPageLayout';
import ContactForm from '../components/static/ContactForm';
import { MessageSquare, Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <StaticPageLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
            <MessageSquare className="text-brand-600" />
            Fale com o Divvy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Envie uma mensagem e nossa equipe retornará o quanto antes.
          </p>
        </div>

        <ContactForm />

        <div className="grid md:grid-cols-2 gap-6">
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
    </StaticPageLayout>
  );
}
