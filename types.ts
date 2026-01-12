
export type UserRole = 'admin' | 'employee';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'paid';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  balance: number;
  pin: string;
  profilePic?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  profile_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: TransactionStatus;
  description: string;
  created_at: string;
}

export interface Loan {
  id: string;
  profile_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: LoanStatus;
  created_at: string;
}

export interface FundStats {
  totalLiquidity: number;
  totalLoansOut: number;
  monthlyGrowth: number;
  activeMembers: number;
}
