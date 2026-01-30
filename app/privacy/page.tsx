'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Introdução',
    content: `A sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos,
usamos, divulgamos e protegemos suas informações quando você usa o Divvy.
Leia atentamente este documento.`,
  },
  {
    title: '2. Informações que Coletamos',
    content: `Coletamos as seguintes informações:
- Email e senha (para autenticação)
- Nome completo e nome exibição
- Avatar/foto de perfil
- Número de telefone (opcional)
- Informações de despesas (valores, datas, categorias, descrições)
- Histórico de pagamentos
- Preferências de tema (claro/escuro)
- Histórico de login`,
  },
  {
    title: '3. Como Usamos Suas Informações',
    content: `Usamos suas informações para:
- Manter e melhorar o serviço
- Autenticar sua conta de forma segura
- Processar transações e calcular saldos
- Enviar notificações e atualizações importantes
- Análise de uso e melhorias de produto
- Conformidade com leis aplicáveis
- Prevenção de fraude e abuso`,
  },
  {
    title: '4. Compartilhamento de Dados',
    content: `Não vendemos seus dados pessoais. Compartilhamos informações apenas com:
- Membros do seu grupo (conforme necessário para divisão de despesas)
- Provedores de serviço (Supabase, Vercel, Resend) sob contrato de confidencialidade
- Autoridades legais quando obrigado por lei
- Seu consentimento explícito`,
  },
  {
    title: '5. Segurança de Dados',
    content: `Implementamos medidas de segurança robustas:
- Criptografia TLS/HTTPS em trânsito
- Criptografia de dados sensíveis em repouso
- Autenticação segura com hashing de senhas (bcrypt)
- Autenticação de dois fatores (2FA) opcional
- Acesso controlado a dados via Row Level Security
- Auditoria de acesso e logs
- Conformidade com LGPD e GDPR`,
  },
  {
    title: '6. Retenção de Dados',
    content: `Retemos seus dados enquanto sua conta estiver ativa. Você pode solicitar a exclusão a qualquer momento.
Após exclusão da conta:
- Dados pessoais são apagados em 30 dias
- Dados transacionais podem ser retidos conforme exigido por lei (até 5 anos)
- Backups podem manter dados por até 90 dias
- Dados anônimos podem ser retidos indefinidamente`,
  },
  {
    title: '7. Seus Direitos',
    content: `Você tem direito a:
- Acessar seus dados pessoais
- Corrigir dados incorretos
- Excluir sua conta e dados
- Exportar seus dados em formato legível
- Revogar consentimento a qualquer momento
- Recusar processamento de dados
Para exercer direitos, contate support@divvy.app`,
  },
  {
    title: '8. Cookies',
    content: `O Divvy usa cookies para:
- Manter você conectado
- Lembrar preferências (tema, idioma)
- Análise de uso (Google Analytics)
Você pode desabilitar cookies em seu navegador, mas isso pode afetar funcionalidade.`,
  },
  {
    title: '9. Links Externos',
    content: `O Divvy pode conter links para sites externos. Não somos responsáveis pelas práticas
de privacidade desses sites. Recomendamos revisar suas políticas de privacidade.`,
  },
  {
    title: '10. Alterações na Política',
    content: `Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você de
mudanças significativas por email ou pelo site. Seu uso continuado constitui aceita da política atualizada.`,
  },
  {
    title: '11. Contato',
    content: `Se tiver perguntas sobre esta Política de Privacidade ou nossas práticas de privacidade,
entre em contato:
Email: privacy@divvy.app
Endereço: São Paulo, Brasil
Responsável pela Privacidade: privacy@divvy.app`,
  },
];

export default function PrivacyPage() {
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
            Política de Privacidade
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
          className="mt-12 p-6 bg-green-50 dark:bg-slate-800 rounded-lg border border-green-200 dark:border-slate-700"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            LGPD Compliant
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            O Divvy segue rigorosamente a Lei Geral de Proteção de Dados (LGPD)
            brasileira e o GDPR europeu. Seu direito à privacidade é nossa
            prioridade máxima.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <Link href="/terms" className="hover:text-blue-600">
              Termos
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
