interface Expense {
  id: string;
  payer_id: string;
  amount: number;
  participants: {
    user_id: string;
    share: number;
  }[];
}

interface UserBalance {
  user_id: string;
  owes: {
    [key: string]: number; // { creditor_id: amount }
  };
  receives: {
    [key: string]: number; // { debtor_id: amount }
  };
}

interface BalanceTransaction {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description: string;
}

/**
 * Calcula saldos entre todos os usuários com base em despesas
 */
export const calculateBalances = (expenses: Expense[]): UserBalance => {
  const balances: UserBalance = {
    user_id: '', // Will be set by caller
    owes: {},
    receives: {},
  };

  expenses.forEach((expense) => {
    // O pagador é a pessoa que deve receber dos outros
    if (!balances.receives[expense.payer_id]) {
      balances.receives[expense.payer_id] = 0;
    }

    // Para cada participante, calcular quanto deve
    expense.participants.forEach((participant) => {
      if (participant.user_id === expense.payer_id) {
        // O pagador não deve nada para si mesmo
        return;
      }

      const share = participant.share;

      // Adicionar ao que o participante deve
      if (!balances.owes[participant.user_id]) {
        balances.owes[participant.user_id] = 0;
      }
      balances.owes[participant.user_id] += share;

      // Adicionar ao que o pagador deve receber
      balances.receives[expense.payer_id] += share;
    });
  });

  return balances;
};

/**
 * Converte saldos complexos em transações simples
 * Usa algoritmo greedy para minimizar transações
 */
export const simplifyTransactions = (
  allBalances: Record<string, UserBalance>
): BalanceTransaction[] => {
  const transactions: BalanceTransaction[] = [];

  // Criar lista de pessoas e quanto elas devem/recebem
  const netBalance: Record<string, number> = {};

  Object.entries(allBalances).forEach(([userId, balance]) => {
    if (!netBalance[userId]) {
      netBalance[userId] = 0;
    }

    // Somar o que a pessoa deve
    Object.values(balance.owes).forEach((amount) => {
      netBalance[userId] -= amount;
    });

    // Somar o que a pessoa deve receber
    Object.values(balance.receives).forEach((amount) => {
      netBalance[userId] += amount;
    });
  });

  // Separar devedores e credores
  const debtors = Object.entries(netBalance)
    .filter(([_, amount]) => amount < 0)
    .sort((a, b) => a[1] - b[1]); // Maior dívida primeiro

  const creditors = Object.entries(netBalance)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]); // Maior crédito primeiro

  // Emparejar devedores com credores
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const [debtor, debtAmount] = debtors[debtorIdx];
    const [creditor, creditAmount] = creditors[creditorIdx];

    const amount = Math.min(-debtAmount, creditAmount);

    if (amount > 0) {
      transactions.push({
        from_user_id: debtor,
        to_user_id: creditor,
        amount: Math.round(amount * 100),
        description: `Deve R$ ${amount.toFixed(2)}`,
      });

      debtors[debtorIdx][1] += amount;
      creditors[creditorIdx][1] -= amount;
    }

    if (Math.abs(debtors[debtorIdx][1]) < 0.01) debtorIdx++;
    if (Math.abs(creditors[creditorIdx][1]) < 0.01) creditorIdx++;
  }

  return transactions;
};

/**
 * Formata saldos para exibição
 */
export const formatBalance = (amount: number): string => {
  if (amount > 0) {
    return `Você deve receber R$ ${(amount / 100).toFixed(2)}`;
  }
  if (amount < 0) {
    return `Você deve pagar R$ ${Math.abs(amount / 100).toFixed(2)}`;
  }
  return 'Sem saldo pendente';
};
