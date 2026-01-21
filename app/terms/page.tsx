'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar e usar o Divvy, você concorda em estar vinculado por estes Termos de Serviço.
Se você não concorda com qualquer parte destes termos, você pode não usar este serviço.
O Divvy se reserva o direito de modificar estes termos a qualquer momento.`,
  },
  {
    title: '2. Descrição do Serviço',
    content: `O Divvy é uma aplicação web para divisão de despesas compartilhadas entre grupos.
O serviço permite criar grupos, registrar despesas, visualizar saldos e gerenciar pagamentos.
Usamos criptografia de ponta a ponta para proteger seus dados financeiros.`,
  },
  {
    title: '3. Conta de Usuário',
    content: `Você é responsável por manter a confidencialidade de sua conta e senha.
Você concorda em aceitar responsabilidade por todas as atividades que ocorrem em sua conta.
Se você suspeitar de uso não autorizado, notifique imediatamente support@divvy.app.`,
  },
  {
    title: '4. Uso Aceitável',
    content: `Você concorda em não usar o Divvy para:
- Atividades ilegais ou que violem leis locais/internacionais
- Enviar spam, malware ou conteúdo prejudicial
- Tentar acessar dados de outros usuários sem autorização
- Violar direitos de propriedade intelectual
- Causar dano a qualquer sistema ou rede`,
  },
  {
    title: '5. Limitação de Responsabilidade',
    content: `O Divvy é fornecido "no estado em que se encontra" sem garantias.
Não somos responsáveis por perdas de dados, danos indiretos ou lucros cessantes.
Nossa responsabilidade total não excede o valor pago por você nos últimos 12 meses.`,
  },
  {
    title: '6. Propriedade Intelectual',
    content: `Todo conteúdo no Divvy (código, design, textos) é propriedade do Divvy ou de seus licenciadores.
Você não pode reproduzir, distribuir ou transmitir qualquer conteúdo sem permissão.
Você concede ao Divvy uma licença não exclusiva para usar seu conteúdo.`,
  },
  {
    title: '7. Rescisão',
    content: `Você pode encerrar sua conta a qualquer momento visitando as configurações.
O Divvy pode encerrar sua conta se você violar estes termos.
Após rescisão, seus dados serão retidos conforme exigido por lei.`,
  },
  {
    title: '8. Modificações do Serviço',
    content: `O Divvy se reserva o direito de modificar ou descontinuar serviços a qualquer momento.
Notificaremos você de mudanças significativas com antecedência.
Seu uso continuado após notificação constitui aceitação das mudanças.`,
  },
  {
    title: '9. Indenização',
    content: `Você concorda em indenizar e manter isento o Divvy de qualquer reclamação, dano ou custo
decorrente de seu uso do serviço ou violação destes termos.`,
  },
  {
    title: '10. Lei Aplicável',
    content: `Estes termos são regidos pela lei brasileira.
Qualquer disputa será resolvida nos tribunais de São Paulo, Brasil.
Você concorda em submeter-se à jurisdição exclusiva destes tribunais.`,
  },
];

export default function TermsPage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Termos de Serviço
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Última atualização: 12 de janeiro de 2026
          </p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {section.title}
                </h2>
                <span className="text-blue-600">
                  {expandedIdx === idx ? '−' : '+'}
                </span>
              </button>

              {expandedIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
                >
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {section.content}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato
            conosco em{' '}
            <a href="mailto:support@divvy.app" className="text-blue-600 hover:underline">
              support@divvy.app
            </a>
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <Link href="/privacy" className="hover:text-blue-600">
              Privacidade
            </Link>
            <Link href="/about" className="hover:text-blue-600">
              Sobre
            </Link>
            <Link href="/support" className="hover:text-blue-600">
              Suporte
            </Link>
          </div>
          <p>&copy; 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
