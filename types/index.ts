// Adicione ao arquivo types/index.ts

export interface Expense {
  id: string;
  divvy_id: string;
  payer_id: string;
  description: string;
  amount: number; // em centavos
  category: 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other';
  date: string;
  split_type: 'equal' | 'custom';
  participants: {
    user_id: string;
    share: number; // em centavos
  }[];
  created_at: string;
  updated_at?: string;
}

export interface DivvyMember {
  id: string;
  divvy_id: string;
  user_id: string;
  joined_at: string;
  role: 'creator' | 'member';
}

export interface Balance {
  from_user_id: string;
  to_user_id: string;
  amount: number; // em centavos
  divvy_id: string;
}
