
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
  start_date?: string;
  end_date?: string;
  is_archived: boolean;
  last_settled_at?: string; // Novo: Marco temporal de bloqueio
  members?: DivvyMember[];
  member_count?: number; 
}

export interface DivvyMember {
  id: string;
  divvy_id: string;
  user_id: string;
  email: string; 
  role: 'admin' | 'member';
  joined_at: string;
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
  is_manually_unlocked: boolean; // Novo: Permissão especial
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  participant_user_id: string;
  amount_owed: number;
  created_at: string;
}

export interface Settlement {
  id: string;
  divvy_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  divvy_id?: string;
  title: string;
  message: string;
  type: 'info' | 'expense' | 'invite' | 'settlement' | 'system';
  is_read: boolean;
  created_at: string;
}
// Resto dos tipos mantidos...
export interface DivvyInvite { id: string; divvy_id: string; invited_email: string; invited_by_user_id: string; status: 'pending' | 'accepted' | 'declined' | 'expired'; expires_at: string; accepted_at?: string; created_at: string; }
export type PaymentMethodType = 'pix' | 'bank_account';
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
export type BankAccountType = 'checking' | 'savings' | 'salary' | 'payment';
export interface Bank { id: string; code: string; name: string; short_name: string; }
export interface PaymentMethod { id: string; user_id: string; type: PaymentMethodType; pix_key?: string; pix_key_type?: PixKeyType; bank_id?: string; bank_name?: string; agency?: string; account_number?: string; account_digit?: string; account_type?: BankAccountType; account_holder_name?: string; account_holder_document?: string; nickname?: string; description?: string; is_primary: boolean; is_active: boolean; is_visible_in_groups: boolean; banks?: Bank; pix_key_masked?: string; agency_masked?: string; account_number_masked?: string; display_text?: string; raw_pix_key?: string; raw_agency?: string; raw_account_number?: string; raw_account_digit?: string; method_type?: PaymentMethodType; }
