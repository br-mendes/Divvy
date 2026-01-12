
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Como faço para criar um grupo?',
    a: 'Após fazer login, clique no botão "Novo Grupo" no seu dashboard. Escolha um nome, tipo de grupo (Viagem, República, etc.) e uma descrição opcional. Você será adicionado automaticamente como administrador.',
  },
  {
    q: 'Como convido pessoas para meu grupo?',
    a: 'Dentro da página do grupo, clique no botão "Convidar" no topo. Insira o e-mail da pessoa que deseja convidar. Ela receberá um e-mail com um link para aceitar o convite. Você também pode compartilhar o link gerado ou o QR Code.',
  },
  {
    q: 'Como registro uma despesa?',
    a: 'No painel do grupo, clique em "Nova Despesa". Insira o valor, escolha a categoria, descreva o gasto e selecione quem pagou. Depois, defina como a despesa deve ser dividida entre os participantes (Igual, Valor exato ou Porcentagem).',
  },
  {
    q: 'Como funciona o fluxo de pagamentos?',
    a: 'Quando você deve a alguém, vá na aba "Saldos" e clique em "Paguei" ao lado da dívida. Isso marcará o pagamento como "Enviado". O credor receberá uma notificação e deverá confirmar o recebimento para que a dívida seja quitada no sistema.',
  },
  {
    q: 'O que acontece quando todas as dívidas são pagas?',
    a: 'Quando todas as transações de um grupo são confirmadas, o sistema sugere o arquivamento do grupo e bloqueia a edição de despesas antigas para manter o histórico íntegro.',
  },
  {
    q: 'O Divvy processa pagamentos reais?',
    a: 'Não. O Divvy é uma ferramenta de organização e cálculo. Os pagamentos reais devem ser feitos por fora (Pix, transferência bancária, dinheiro, etc.). Use o Divvy para registrar que o pagamento foi feito.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Utilizamos criptografia TLS/HTTPS para todas as comunicações. Suas senhas são protegidas e utilizamos Row Level Security (RLS) no banco de dados para garantir que apenas membros do grupo acessem suas informações.',
  },
  {
    q: 'Posso usar no celular?',
    a: 'Sim! O Divvy é um web app totalmente responsivo, projetado para funcionar perfeitamente em smartphones, tablets e computadores.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <HelpCircle className="text-brand-600" />
          Perguntas Frequentes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Respostas para as dúvidas mais comuns sobre o Divvy.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
              >
                <span className="font-bold text-gray-900 dark:text-white pr-4">{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp className="text-brand-500 shrink-0" />
                ) : (
                  <ChevronDown className="text-gray-400 shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="p-5 pt-0 border-t border-gray-50 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50">
                  <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl p-8 text-center border border-brand-100 dark:border-brand-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ainda tem dúvidas?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Nossa equipe de suporte está pronta para ajudar você.
          </p>
          <a href="/support" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 transition-colors">
            Fale com o Suporte
          </a>
        </div>
      </div>
    </Layout>
  );
}
