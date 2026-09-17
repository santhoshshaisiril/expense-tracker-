import {
  Category,
  DashboardData,
  Transaction,
  Budget,
  MonthlyReportData,
  CategoryReportData,
  User
} from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('smart_expense_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('smart_expense_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('smart_expense_token');
  localStorage.removeItem('smart_expense_user');
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem('smart_expense_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem('smart_expense_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = isJson && data.message ? data.message : (data.error || `HTTP error ${res.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email?: string; username?: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (payload: { full_name: string; email: string; password: string; confirm_password: string; username?: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout/', { method: 'POST' }),

  getProfile: () =>
    request<{ user: User }>('/auth/me/'),

  // Categories
  getCategories: (type?: 'Income' | 'Expense') => {
    const q = type ? `?type=${type}` : '';
    return request<Category[]>(`/categories/${q}`);
  },

  createCategory: (cat: { name: string; category_type: 'Income' | 'Expense'; description?: string }) =>
    request<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify(cat)
    }),

  updateCategory: (id: number, cat: Partial<Category>) =>
    request<Category>(`/categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(cat)
    }),

  deleteCategory: (id: number) =>
    request<{ message: string }>(`/categories/${id}/`, {
      method: 'DELETE'
    }),

  // Transactions
  getTransactions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      results: Transaction[];
    }>(`/transactions/${qs}`);
  },

  getTransaction: (id: number) =>
    request<Transaction>(`/transactions/${id}/`),

  createTransaction: (tx: {
    transaction_type: 'Income' | 'Expense';
    amount: number;
    category_id: number;
    description: string;
    payment_method: string;
    transaction_date: string;
    notes?: string;
  }) =>
    request<{ message: string; transaction: Transaction }>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(tx)
    }),

  updateTransaction: (id: number, tx: Partial<Transaction>) =>
    request<{ message: string; transaction: Transaction }>(`/transactions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(tx)
    }),

  deleteTransaction: (id: number) =>
    request<{ message: string }>(`/transactions/${id}/`, {
      method: 'DELETE'
    }),

  // Budgets
  getBudgets: () =>
    request<Budget[]>('/budgets/'),

  createBudget: (budget: {
    category_id?: number | string | null;
    amount: number;
    start_date: string;
    end_date: string;
  }) =>
    request<Budget>('/budgets/', {
      method: 'POST',
      body: JSON.stringify(budget)
    }),

  updateBudget: (id: number, budget: Partial<Budget>) =>
    request<Budget>(`/budgets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(budget)
    }),

  deleteBudget: (id: number) =>
    request<{ message: string }>(`/budgets/${id}/`, {
      method: 'DELETE'
    }),

  // Dashboard
  getDashboard: () =>
    request<DashboardData>('/dashboard/'),

  // Reports
  getMonthlyReport: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.append('year', String(year));
    if (month) q.append('month', String(month));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<MonthlyReportData>(`/reports/monthly/${qs}`);
  },

  getCategoryReport: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<CategoryReportData>(`/reports/category/${qs}`);
  },

  // Demo utilities & DB inspector
  resetDemoData: () =>
    request<{ message: string }>('/demo/reset/', {
      method: 'POST'
    }),

  inspectSchema: () =>
    request<{
      database: string;
      engine: string;
      tables: Record<string, { count: number; columns: any[] }>;
    }>('/schema/inspect/')
};
