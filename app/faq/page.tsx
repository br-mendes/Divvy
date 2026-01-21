'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

const categories = [
  {
    name: 'Geral',
    icon: '',
    faqs: [
      {
        q: 'O que é Divvy?',
        a: 'Divvy é um aplicativo web para dividir despesas compartilhadas entre grupos de forma justa e automática. Você pode criar grupos, registrar despesas, visualizar saldos e rastrear pagamentos.',
      },
      {
        q: 'Quanto custa o Divvy?',
        a: 'O Divvy é totalmente grátis! Não cobramos taxas de transação, inscrição ou qualquer outra taxa. O serviço é financiado por anúncios discretos (em desenvolvimento).',
      },
      {
        q: 'Posso usar sem criar uma conta?',
        a: 'Não, você precisa criar uma conta para usar o Divvy. Isso garante segurança e privacidade dos seus dados financeiros.',
      },
    ],
  },
  {
    name: 'Conta & Segurança',
    icon: '',
    faqs: [
      {
        q: 'Como me registro?',
        a: 'Clique em "Criar Conta" na página inicial. Você pode usar email/senha ou fazer login com Google OAuth. Confirme seu email e você está dentro!',
      },
      {
        q: 'O Divvy é seguro?',
        a: 'Sim! Usamos criptografia HTTPS, hashing de senhas com bcrypt, 2FA opcional e Row Level Security no banco de dados. Seus dados financeiros são protegidos.',
      },
      {
        q: 'Como habilitar 2FA?',
        a: 'Vá para Configurações > Segurança > Ativar 2FA. Escaneie o código QR com seu autenticador (Google Authenticator, Authy, etc.) e confirme o código.',
      },
      {
        q: 'Posso deletar minha conta?',
        a: 'Sim. Vá para Configurações > Danger Zone > Deletar Conta. Seus dados serão apagados permanentemente após 30 dias (período de retenção).',
      },
    ],
  },
  {
    name: 'Grupos & Despesas',
    icon: '',
    faqs: [
      {
        q: 'Como criar um grupo?',
        a: 'No Dashboard, clique em "Novo Grupo". Escolha um nome, tipo (viagem, república, casal, evento) e descrição. Você será o criador/admin do grupo.',
      },
      {
        q: 'Quantas pessoas podem estar em um grupo?',
        a: 'Não há limite! Você pode ter 2 pessoas (casal) ou 100+ pessoas. O cálculo de saldos é automático.',
      },
      {
        q: 'Como adicionar uma despesa?',
        a: 'No grupo, clique em "Adicionar Despesa". Preenchas o valor, categoria, descrição e data. Selecione quem participou da despesa. O Divvy calcula automaticamente quem deve a quem.',
      },
      {
        q: 'Posso editar uma despesa registrada?',
        a: 'Sim, até que seja bloqueada após arquivamento do grupo. Após bloqueio, você não pode editar ou deletar.',
      },
    ],
  },
  {
    name: 'Divisão & Saldos',
    icon: '',
    faqs: [
      {
        q: 'Como funciona a divisão de despesas?',
        a: 'Quando você registra uma despesa, pode dividir de 3 formas: (1) igualmente entre todos, (2) por porcentagem customizada, (3) valores exatos customizados.',
      },
      {
        q: 'Posso ver quanto devo a cada pessoa?',
        a: 'Sim! A seção "Saldos" mostra exatamente quem deve a quem. Você verá um resumo de todas as dívidas e créditos.',
      },
      {
        q: 'Como são calculados os saldos?',
        a: 'O Divvy usa algoritmo de otimização para calcular o mínimo de transações necessárias. Por exemplo, em vez de 4 pagamentos cruzados, talvez apenas 2 sejam necessários.',
      },
      {
        q: 'Posso dividir uma despesa customizada (não igualmente)?',
        a: 'Sim! Você pode inserir porcentagens ou valores exatos para cada pessoa. Útil quando nem todo mundo consumiu a mesma quantidade.',
      },
    ],
  },
  {
    name: 'Pagamentos',
    icon: '',
    faqs: [
      {
        q: 'Como marcar um pagamento?',
        a: 'Na seção Saldos, clique em uma dívida. Escolha "Marcar como Enviado" quando você fizer a transferência. O credor pode confirmar após receber o dinheiro.',
      },
      {
        q: 'Qual o fluxo de um pagamento?',
        a: 'Pendente → Enviado (devedor clica) → Confirmado ou Rejeitado (credor clica). Se confirmado e grupo está arquivado, as despesas são bloqueadas.',
      },
      {
        q: 'Posso rejeitar um pagamento?',
        a: 'Sim, se você (credor) recusou o pagamento. Clique em "Rejeitar" e você pode entrar em contato com o devedor para resolver.',
      },
      {
        q: 'O Divvy processa pagamentos automaticamente?',
        a: 'Não. Divvy apenas rastreia e calcula saldos. Os pagamentos reais devem ser feitos via transferência bancária, PIX, dinheiro, etc.',
      },
    ],
  },
  {
    name: 'Membros & Convites',
    icon: '',
    faqs: [
      {
        q: 'Como convidar membros para um grupo?',
        a: 'Nos detalhes do grupo, clique em "Convidar Membros". Você pode enviar email direto, copiar link de convite ou gerar QR code.',
      },
      {
        q: 'Por quanto tempo o convite é válido?',
        a: 'Convites expiram após 7 dias. Você pode gerar um novo link se expirar.',
      },
      {
        q: 'Posso remover um membro do grupo?',
        a: 'Sim, se você é admin. Clique no membro na seção "Membros" e selecione "Remover". Eles perdem acesso ao grupo.',
      },
      {
        q: 'O que é um "admin" vs "membro"?',
        a: 'Admin: pode convidar, remover membros, arquivar, sugerir exclusão. Membro: pode adicionar despesas e visualizar dados. O criador começa como admin.',
      },
    ],
  },
  {
    name: 'Arquivo & Fechamento',
    icon: '',
    faqs: [
      {
        q: 'O que é "arquivar um grupo"?',
        a: 'Arquivar significa marcar o grupo como finalizado. Todos os saldos são confirmados e as despesas são bloqueadas (não podem ser editadas/deletadas).',
      },
      {
        q: 'Quando devo arquivar?',
        a: 'Quando a viagem acabou, o contrato de aluguel terminou, o casal se separa, etc. Qualquer admin pode sugerir, e todos devem confirmar.',
      },
      {
        q: 'Posso desarchivar um grupo?',
        a: 'Sim. Você pode ativar novamente se necessário. Despesas bloqueadas continuam bloqueadas.',
      },
    ],
  },
];

export default function FAQPage() {
  const [expandedIdxs, setExpandedIdxs] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIdxs);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIdxs(newSet);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Encontre respostas para as perguntas mais comuns sobre o Divvy
          </p>
        </motion.div>

        <div className="space-y-12">
          {categories.map((category, catIdx) => (
            <motion.div
              key={catIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: catIdx * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.name}
                </h2>
              </div>

              <div className="space-y-3">
                {category.faqs.map((faq, idx) => {
                  const id = `${catIdx}-${idx}`;
                  const isExpanded = expandedIdxs.has(id);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpanded(id)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {faq.q}
                        </h3>
                        <span className="text-blue-600 font-bold">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </button>

                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900"
                        >
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 text-center"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Não encontrou a resposta?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Entre em contato com nossa equipe de suporte para ajuda.
          </p>
          <Link href="/support" className="text-blue-600 hover:underline font-semibold">
            Ir para Suporte →
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <Link href="/terms" className="hover:text-blue-600">
              Termos
            </Link>
            <Link href="/privacy" className="hover:text-blue-600">
              Privacidade
            </Link>
            <Link href="/about" className="hover:text-blue-600">
              Sobre
            </Link>
          </div>
          <p>&copy; 2026 Divvy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
