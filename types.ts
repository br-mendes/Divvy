
export interface UserProfile {
  id: string; // FK auth.users
  email: string;
  fullname: string;
  displayname: string;
  avatarurl?: string;
  phone?: string;
  twofactorenabled: boolean;
  last_login_at?: string;
  createdat: string;
  updatedat: string;
}

export type DivvyType = 'trip' | 'roommate' | 'couple' | 'event' | 'other';

export interface Divvy {
  id: string;
  name: string;
  description?: string;
  creatorid: string;
  type: DivvyType;
  createdat: string;
  endedat?: string;
  isarchived: boolean;
  archivesuggested: boolean;
  archivesuggestedat?: string;
  lastglobalconfirmationat?: string; // Data da última confirmação global
  members?: DivvyMember[]; // Join manual
  member_count?: number; 
}

export interface DivvyMember {
  id: string;
  divvyid: string;
  userid: string;
  email: string;
  role: 'admin' | 'member';
  joinedat: string;
  userprofiles?: UserProfile; // Join manual
}

export interface DivvyInvite {
  id: string;
  divvyid: string;
  invitedemail: string;
  invitedbyuserid: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresat: string;
  acceptedat?: string;
  createdat: string;
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
  divvyid: string;
  paidbyuserid: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string; // YYYY-MM-DD
  receiptphotourl?: string;
  locked: boolean;
  lockedreason?: string;
  lockedat?: string;
  createdat: string;
  updatedat: string;
}

export interface ExpenseSplit {
  id: string;
  expenseid: string;
  participantuserid: string;
  amountowed: number;
  createdat: string;
}

export type TransactionStatus = 'pending' | 'paymentsent' | 'confirmed' | 'rejected';

export interface Transaction {
  id: string;
  divvyid: string;
  fromuserid: string; // Quem deve
  touserid: string;   // Quem recebe
  amount: number;
  status: TransactionStatus;
  paidat?: string;
  createdat: string;
  updatedat: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'inactive30' | 'active';
  createdat: string;
}

export interface SupportTicket {
  id: string;
  name?: string;
  email: string;
  subject: string;
  message: string;
  createdat: string;
}

export interface Notification {
  id: string;
  user_id: string;
  divvy_id?: string;
  type: 'expense' | 'settlement' | 'invite' | 'other';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Bank {
  id: string;
  code: string;
  name: string;
  short_name: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'pix' | 'bank_account';
  method_type?: 'pix' | 'bank_account';
  is_primary: boolean;
  is_visible_in_groups: boolean;
  is_active: boolean;
  pix_key?: string;
  pix_key_type?: string;
  raw_pix_key?: string;
  pix_key_masked?: string;
  bank_id?: string;
  agency?: string;
  raw_agency?: string;
  account_number?: string;
  raw_account_number?: string;
  account_digit?: string;
  raw_account_digit?: string;
  account_type?: string;
  account_holder_name?: string;
  account_holder_document?: string;
  banks?: Bank;
  created_at?: string;
  updated_at?: string;
}
