export type TransactionType = 'Income' | 'Expense';

export type PaymentMethod = 'Cash' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'Other';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export interface Category {
  id: number;
  user_id?: number;
  name: string;
  category_type: TransactionType;
  description?: string;
  created_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  transaction_type: TransactionType;
  amount: number;
  category_id: number;
  category_name: string;
  description: string;
  payment_method: PaymentMethod;
  transaction_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number | null;
  category_name?: string | null;
  amount: number;
  start_date: string;
  end_date: string;
  spent: number;
  remaining: number;
  usage_percent: number;
  status: 'Safe' | 'Warning' | 'Exceeded';
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  current_balance: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_budget: number;
  remaining_budget: number;
  savings: number;
  savings_percentage: number;
}

export interface BudgetUsage {
  budget: number;
  used: number;
  remaining: number;
  percent: number;
}

export interface SmartAlert {
  id: string;
  level: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  category?: string;
  percent: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  charts: {
    expense_by_category: Array<{ category: string; amount: number }>;
    monthly_trend: Array<{ month: string; income: number; expense: number }>;
    weekly_spending: Array<{ day: string; date: string; amount: number }>;
    budget_usage: BudgetUsage;
    top_categories: Array<{ category: string; amount: number }>;
  };
  recent_transactions: Transaction[];
  alerts: SmartAlert[];
}

export interface MonthlyReportData {
  period: {
    year: number;
    month: number;
    start_date: string;
    end_date: string;
    days_in_month: number;
  };
  summary: {
    total_income: number;
    total_expenses: number;
    savings: number;
    budget: number;
    remaining_budget: number;
    average_daily_expense: number;
    highest_expense?: Transaction;
    highest_spending_category?: { category_name: string; total_amount: number };
    total_transactions: number;
  };
  transactions: Transaction[];
}

export interface CategoryReportItem {
  category_id: number;
  category_name: string;
  description: string;
  transaction_count: number;
  total_spending: number;
  percentage: number;
}

export interface CategoryReportData {
  total_expenses: number;
  categories: CategoryReportItem[];
}
