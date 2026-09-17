import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Zap,
  Award,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MonthlyReportData, Transaction } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const MonthlySummaryPage: React.FC = () => {
  const { showToast } = useToast();
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = [2024, 2025, 2026, 2027];

  const fetchMonthlyReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMonthlyReport(year, month);
      setReport(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch monthly report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const summary = report?.summary || {
    total_income: 0,
    total_expenses: 0,
    savings: 0,
    budget: 0,
    remaining_budget: 0,
    average_daily_expense: 0,
    total_transactions: 0
  };

  const monthName = months.find(m => m.value === month)?.label || '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monthly Financial Summary</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete period breakdown with averages, highest category outlays, and ledger transactions
          </p>
        </div>

        {/* Month Selector Bar */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer border-l border-slate-200"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            title="Print Monthly Summary"
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer border-l border-slate-200"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{summary.total_income.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Logged for {monthName} {year}</p>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{summary.total_expenses.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Recorded outgoing transactions</p>
        </div>

        {/* Savings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Net Savings</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 ${summary.savings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            ₹{summary.savings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Income minus Expenses</p>
        </div>

        {/* Average Daily Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Avg Daily Expense</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            ₹{summary.average_daily_expense.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated over {report?.period.days_in_month || 30} days</p>
        </div>
      </div>

      {/* Secondary Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Highest Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Highest Single Expense</span>
            {summary.highest_expense ? (
              <>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ₹{summary.highest_expense.amount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                  {summary.highest_expense.description} ({summary.highest_expense.category_name})
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-1">No expenses in this period</p>
            )}
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Highest Spending Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Spending Category</span>
            {summary.highest_spending_category ? (
              <>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {summary.highest_spending_category.category_name}
                </div>
                <p className="text-xs text-slate-500">
                  Total: ₹{summary.highest_spending_category.total_amount.toLocaleString('en-IN')}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-1">None</p>
            )}
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activity Count</span>
            <div className="text-lg font-black text-slate-900 mt-1">
              {summary.total_transactions} Transactions
            </div>
            <p className="text-xs text-slate-500">Recorded in ledger</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Hash className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Transactions Breakdown for Month */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Transaction Breakdown ({monthName} {year})
            </h3>
            <p className="text-xs text-slate-400">All ledger events within this monthly billing cycle</p>
          </div>
          <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-100 rounded-full">
            {report?.transactions.length || 0} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!report?.transactions || report.transactions.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No transactions found for {monthName} {year}.
                  </td>
                </tr>
              ) : (
                report.transactions.map(tx => {
                  const isInc = tx.transaction_type === 'Income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">#{tx.id}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isInc ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{tx.transaction_date}</td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{tx.category_name}</td>
                      <td className="px-5 py-3 text-slate-900 font-medium">{tx.description}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{tx.payment_method}</td>
                      <td className={`px-5 py-3 text-right font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
