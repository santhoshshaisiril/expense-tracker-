import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as BudgetIcon,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  PlusCircle
} from 'lucide-react';
import { DashboardData, Transaction, Category } from '../types';
import { api } from '../services/api';
import {
  ExpenseCategoryDonut,
  MonthlyTrendBarChart,
  WeeklySpendingChart,
  BudgetUsageGauge,
  TopSpendingCategoriesChart
} from '../components/Charts';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

interface DashboardPageProps {
  categories: Category[];
  onNavigate: (tab: any) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  categories,
  onNavigate,
  onOpenAddExpense,
  onOpenAddIncome,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    total_income: 0,
    total_expenses: 0,
    current_balance: 0,
    monthly_income: 0,
    monthly_expense: 0,
    monthly_budget: 20000,
    remaining_budget: 0,
    savings: 0,
    savings_percentage: 0
  };

  const summaryCards = [
    {
      id: 'total-income',
      title: 'Total Income',
      amount: summary.total_income,
      subtitle: `This month: ₹${summary.monthly_income.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'emerald',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 'total-expenses',
      title: 'Total Expenses',
      amount: summary.total_expenses,
      subtitle: `This month: ₹${summary.monthly_expense.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      color: 'rose',
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      iconBg: 'bg-rose-100 text-rose-700'
    },
    {
      id: 'current-balance',
      title: 'Current Balance',
      amount: summary.current_balance,
      subtitle: summary.current_balance >= 0 ? 'Healthy cashflow' : 'Negative balance',
      icon: Wallet,
      color: 'blue',
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      iconBg: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'monthly-budget',
      title: 'Monthly Budget',
      amount: summary.monthly_budget,
      subtitle: 'Target spending limit',
      icon: BudgetIcon,
      color: 'indigo',
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      iconBg: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'remaining-budget',
      title: 'Remaining Budget',
      amount: summary.remaining_budget,
      subtitle: `${Math.round(summary.monthly_budget > 0 ? (summary.remaining_budget / summary.monthly_budget) * 100 : 0)}% budget unspent`,
      icon: ShieldCheck,
      color: 'purple',
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      iconBg: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'savings',
      title: 'Savings',
      amount: summary.savings,
      subtitle: `${summary.savings_percentage}% savings rate`,
      icon: PiggyBank,
      color: 'teal',
      bg: 'bg-teal-50 text-teal-600 border-teal-100',
      iconBg: 'bg-teal-100 text-teal-700'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time metrics calculated dynamically from SQLite database</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
          >
            + Add Income
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            + Add Expense
          </button>
        </div>
      </div>

      {/* Smart Budget Alert Banner (if any) */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-3">
          {data.alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
                alert.level === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${alert.level === 'danger' ? 'bg-rose-200/60' : 'bg-amber-200/60'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{alert.title}</h4>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('budgets')}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white shadow-2xs border border-slate-200/60 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Manage Budget &rarr;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 1. Summary Cards (6 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                  ₹{card.amount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Charts Section (Charts 1, 2, 3, 4, 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Expense by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Expense by Category</h3>
              <p className="text-xs text-slate-400">Proportional spending distribution across active categories</p>
            </div>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage
            </button>
          </div>
          <ExpenseCategoryDonut data={data?.charts.expense_by_category || []} />
        </div>

        {/* Chart 2: Monthly Income vs Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Income vs Expense</h3>
              <p className="text-xs text-slate-400">Cashflow performance comparison over the last 6 months</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Report
            </button>
          </div>
          <MonthlyTrendBarChart data={data?.charts.monthly_trend || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 3: Weekly Spending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Weekly Spending</h3>
          <p className="text-xs text-slate-400 mb-2">Daily breakdown for the current week</p>
          <WeeklySpendingChart data={data?.charts.weekly_spending || []} />
        </div>

        {/* Chart 4: Budget Usage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Budget Usage</h3>
              <p className="text-xs text-slate-400">Monthly cap utilization</p>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Details
            </button>
          </div>
          <BudgetUsageGauge
            budget={data?.charts.budget_usage.budget || 20000}
            used={data?.charts.budget_usage.used || 0}
            remaining={data?.charts.budget_usage.remaining || 0}
            percent={data?.charts.budget_usage.percent || 0}
          />
        </div>

        {/* Chart 5: Top Spending Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Spending</h3>
              <p className="text-xs text-slate-400">Highest financial outlays</p>
            </div>
          </div>
          <TopSpendingCategoriesChart data={data?.charts.top_categories || []} />
        </div>
      </div>

      {/* 3. Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest financial logs recorded in SQLite</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!data?.recent_transactions || data.recent_transactions.length === 0) ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No transactions recorded yet. Click "Add Expense" to get started!
                  </td>
                </tr>
              ) : (
                data.recent_transactions.map(tx => {
                  const isInc = tx.transaction_type === 'Income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">#{tx.id}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{tx.category_name}</td>
                      <td className="px-5 py-3 text-slate-900 font-medium max-w-xs truncate">{tx.description}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{tx.payment_method}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{tx.transaction_date}</td>
                      <td className={`px-5 py-3 text-right font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={(tx) => onEditTransaction(tx)}
        onDelete={(tx) => onDeleteTransaction(tx)}
      />
    </div>
  );
};
