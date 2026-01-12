
import React from 'react';
import { Layout } from '../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <article className="max-w-4xl mx-auto py-8 px-4 prose prose-gray dark:prose-invert">
        <h1>Termos de Uso do Divvy</h1>
        <p className="lead text-lg text-gray-600 dark:text-gray-400">
          Data de Vigência: 12 de janeiro de 2026
        </p>

        <p>
          Bem-vindo ao Divvy ("Plataforma", "Serviço", "nós" ou "Divvy"). Estes Termos de Uso 
          ("Termos") constituem um acordo legal vinculativo entre você ("Usuário", "você" ou "sua") 
          e a AMX Solutions, responsável pelo desenvolvimento do Divvy.
        </p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar o Divvy, você concorda em cumprir estes Termos. Se você não concordar 
          com qualquer parte dos termos, não deverá acessar o serviço.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O Divvy é uma ferramenta para auxiliar grupos de pessoas a organizar e dividir despesas 
          compartilhadas. A plataforma oferece funcionalidades para registro de gastos, cálculo 
          de saldos e registro de pagamentos.
        </p>
        <p><strong>Importante:</strong> O Divvy não processa transações financeiras reais. Todos os pagamentos registrados na plataforma são apenas informativos e devem ser realizados externamente pelos usuários.</p>

        <h2>3. Contas de Usuário</h2>
        <ul>
          <li>Você é responsável por manter a confidencialidade de sua conta e senha.</li>
          <li>Você concorda em fornecer informações verdadeiras e precisas durante o cadastro.</li>
          <li>Você pode excluir sua conta a qualquer momento através das configurações.</li>
        </ul>

        <h2>4. Uso Aceitável</h2>
        <p>Você concorda em não usar o serviço para:</p>
        <ul>
          <li>Atividades ilegais ou fraudulentas.</li>
          <li>Violar direitos de propriedade intelectual.</li>
          <li>Transmitir vírus ou códigos maliciosos.</li>
          <li>Assediar ou prejudicar outros usuários.</li>
        </ul>

        <h2>5. Isenção de Responsabilidade</h2>
        <p>
          O serviço é fornecido "como está". Não garantimos que o serviço será ininterrupto ou 
          livre de erros. A responsabilidade pelos acertos financeiros e pagamentos reais é 
          exclusivamente dos usuários. O Divvy não se responsabiliza por disputas financeiras 
          entre membros de grupos.
        </p>

        <h2>6. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos 
          sobre alterações significativas. O uso continuado após alterações constitui aceitação.
        </p>

        <h2>7. Contato</h2>
        <p>
          Para questões sobre estes termos, entre em contato em: <strong>falecomdivvy@gmail.com</strong>
        </p>
      </article>
    </Layout>
  );
}
