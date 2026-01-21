export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Divvy {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  currency: string;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  members?: DivvyMember[];
}

export interface DivvyMember {
  id: string;
  divvy_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface Expense {
  id: string;
  divvy_id: string;
  paid_by_user_id: string;
  amount: number;
  description: string;
  category: string;
  expense_date: string;
  created_at: string;
  updated_at?: string;
  paid_by?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  participant_user_id: string;
  amount_owed: number;
  created_at: string;
  participant?: User;
}

export interface Balance {
  user_id: string;
  user_name: string;
  paid: number;
  share: number;
  net: number;
}
