export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Divvy {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  type: 'trip' | 'roommate' | 'couple' | 'event' | 'other';
  currency: string;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  is_archived: boolean;
  members?: DivvyMember[];
}

export interface DivvyMember {
  id: string;
  divvy_id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: User;
}

export interface Expense {
  id: string;
  divvy_id: string;
  paid_by_user_id: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'accommodation' | 'activity' | 'utilities' | 'shopping' | 'other';
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
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

export interface Transaction {
  id: string;
  divvy_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  status: 'pending' | 'paid';
  paid_at?: string;
  created_at: string;
  from_user?: User;
  to_user?: User;
}
