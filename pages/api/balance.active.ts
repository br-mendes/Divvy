
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();
  const { divvyId } = req.query;

  if (!divvyId || typeof divvyId !== 'string') {
    return res.status(400).json({ error: 'divvyId is required' });
  }

  try {
    // 1. Validar acesso (opcional se confiarmos no middleware, mas bom ter)
    // Aqui assumimos que o request vem autenticado via cookie pelo browser
    // Para simplificar a API, vamos buscar os dados brutos e calcular.
    
    // Buscar membros para inicializar saldos
    const { data: members, error: mErr } = await supabase
      .from('divvymembers')
      .select('userid')
      .eq('divvyid', divvyId);

    if (mErr) throw mErr;

    // Buscar despesas (creditos para quem pagou)
    const { data: expenses, error: eErr } = await supabase
      .from('expenses')
      .select('id, paidbyuserid, amount')
      .eq('divvyid', divvyId);

    if (eErr) throw eErr;

    // Buscar splits (débitos para quem participou)
    // Precisamos dos splits de todas as despesas desse grupo
    const expenseIds = expenses?.map(e => e.id) || [];
    let splits: any[] = [];
    if (expenseIds.length > 0) {
      const { data: sData, error: sErr } = await supabase
        .from('expensesplits')
        .select('participantuserid, amountowed')
        .in('expenseid', expenseIds);
      
      if (sErr) throw sErr;
      splits = sData || [];
    }

    // Buscar transações (pagamentos diretos)
    const { data: transactions, error: tErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('divvyid', divvyId)
      .order('createdat', { ascending: false });

    if (tErr) throw tErr;

    // --- CÁLCULO DE SALDOS ---
    const balances: Record<string, number> = {};

    // Inicializar
    members?.forEach(m => {
      balances[m.userid] = 0;
    });

    // + Créditos (Pagou despesa)
    expenses?.forEach(e => {
      if (balances[e.paidbyuserid] !== undefined) {
        balances[e.paidbyuserid] += e.amount;
      }
    });

    // - Débitos (Participou da despesa)
    splits.forEach(s => {
      if (balances[s.participantuserid] !== undefined) {
        balances[s.participantuserid] -= s.amountowed;
      }
    });

    // Ajuste por Transações (Apenas confirmadas impactam o saldo contábil real, 
    // mas visualmente podemos querer mostrar impacto de pendentes. 
    // Pela regra de negócio, apenas 'confirmed' quita a dívida).
    transactions?.forEach(t => {
      if (t.status === 'confirmed') {
        // Quem pagou (from) "recupera" saldo (fica menos negativo ou mais positivo)
        // Quem recebeu (to) "perde" saldo (fica menos positivo ou mais negativo)
        // Pense: Dívida é saldo negativo. Pagar aumenta o saldo em direção a 0.
        if (balances[t.fromuserid] !== undefined) balances[t.fromuserid] += t.amount;
        if (balances[t.touserid] !== undefined) balances[t.touserid] -= t.amount;
      }
    });

    return res.status(200).json({ 
      balances, 
      transactions: transactions || [] 
    });

  } catch (error: any) {
    console.error('Balance API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
