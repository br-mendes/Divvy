
import React from 'react';
import { Layout } from '../components/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <article className="max-w-4xl mx-auto py-8 px-4 prose prose-gray dark:prose-invert">
        <h1>Política de Privacidade do Divvy</h1>
        <p className="lead text-lg text-gray-600 dark:text-gray-400">
          Data de Vigência: 12 de janeiro de 2026
        </p>

        <p>
          A sua privacidade é importante para nós. Esta Política de Privacidade explica como o 
          Divvy coleta, usa e protege suas informações pessoais, em conformidade com a LGPD 
          (Lei Geral de Proteção de Dados).
        </p>

        <h2>1. Informações que Coletamos</h2>
        <p>Coletamos as seguintes informações para fornecer nossos serviços:</p>
        <ul>
          <li><strong>Informações de Conta:</strong> Nome, endereço de e-mail e foto de perfil (opcional).</li>
          <li><strong>Dados de Uso:</strong> Informações sobre grupos criados, despesas registradas e transações.</li>
          <li><strong>Logs Técnicos:</strong> Endereço IP, tipo de navegador e dados de acesso para segurança e análise.</li>
        </ul>

        <h2>2. Como Usamos Seus Dados</h2>
        <ul>
          <li>Para fornecer, operar e manter nosso serviço.</li>
          <li>Para gerenciar sua conta e enviar notificações relevantes (convites, alertas de pagamento).</li>
          <li>Para melhorar, personalizar e expandir nossa plataforma.</li>
          <li>Para prevenir fraudes e garantir a segurança do sistema.</li>
        </ul>

        <h2>3. Compartilhamento de Dados</h2>
        <p>
          Não vendemos seus dados pessoais. Compartilhamos informações apenas nas seguintes circunstâncias:
        </p>
        <ul>
          <li><strong>Com outros usuários:</strong> Seu nome, foto e atividades financeiras dentro de um grupo são visíveis para os outros membros desse grupo.</li>
          <li><strong>Prestadores de Serviço:</strong> Utilizamos serviços de terceiros confiáveis para hospedagem (Supabase), autenticação e envio de e-mails (Resend).</li>
          <li><strong>Requisito Legal:</strong> Se exigido por lei ou ordem judicial.</li>
        </ul>

        <h2>4. Segurança dos Dados</h2>
        <p>
          Implementamos medidas de segurança robustas, incluindo criptografia TLS, armazenamento seguro de senhas 
          e controles de acesso rigorosos para proteger suas informações contra acesso não autorizado.
        </p>

        <h2>5. Seus Direitos</h2>
        <p>Você tem o direito de:</p>
        <ul>
          <li>Acessar, corrigir ou excluir seus dados pessoais.</li>
          <li>Solicitar a portabilidade dos seus dados.</li>
          <li>Revogar seu consentimento a qualquer momento.</li>
        </ul>
        <p>
          Para exercer esses direitos, entre em contato conosco ou utilize as ferramentas disponíveis nas configurações da sua conta.
        </p>

        <h2>6. Retenção de Dados</h2>
        <p>
          Mantemos suas informações enquanto sua conta estiver ativa ou conforme necessário para 
          fornecer o serviço. Após a exclusão da conta, seus dados pessoais serão removidos, 
          embora registros de transações anônimos possam ser mantidos para fins de integridade histórica dos grupos.
        </p>

        <h2>7. Contato</h2>
        <p>
          Se tiver dúvidas sobre esta Política de Privacidade, entre em contato em: <strong>falecomdivvy@gmail.com</strong>
        </p>
      </article>
    </Layout>
  );
}
