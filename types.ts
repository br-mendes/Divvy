
export interface User {
  id: string;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
}

export type DivvyType = 'trip' | 'roommate' | 'event' | 'general';

export interface Divvy {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  type: DivvyType;
  created_at: string;
  ended_at?: string;
  is_archived: boolean;
  members?: DivvyMember[];
}

export interface DivvyMember {
  id: string;
  divvy_id: string;
  user_id: string;
  email: string; // Mantido para fallback
  role: 'admin' | 'member';
  joined_at: string;
  // Dados unidos da tabela profiles
  profiles?: Profile;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'utilities'
  | 'shopping'
  | 'other';

export interface Expense {
  id: string;
  divvy_id: string;
  paid_by_user_id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  participant_user_id: string;
  amount_owed: number;
  created_at: string;
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
}

export interface DivvyInvite {
  id: string;
  divvy_id: string;
  invited_email: string;
  invited_by_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}
