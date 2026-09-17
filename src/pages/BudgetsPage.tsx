import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  IndianRupee,
  X,
  TrendingDown
} from 'lucide-react';
import { Budget, Category } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface BudgetsPageProps {
  categories: Category[];
  onRefresh: () => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ categories, onRefresh }) => {
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  // Delete state
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const expenseCategories = categories.filter(c => c.category_type === 'Expense');

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBudgets();
      setBudgets(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch budgets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const openAddModal = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
    setStartDate(firstDay);
    setEndDate(lastDay);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.category_id ? String(b.category_id) : '');
    setAmount(String(b.amount));
    setStartDate(b.start_date);
    setEndDate(b.end_date);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setModalError('Valid budget amount is required.');
      return;
    }
    if (!startDate || !endDate) {
      setModalError('Start and end dates are required.');
      return;
    }
    if (startDate > endDate) {
      setModalError('Start date cannot be after end date.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');
    try {
      const payload = {
        category_id: categoryId ? Number(categoryId) : null,
        amount: parsedAmt,
        start_date: startDate,
        end_date: endDate
      };

      if (editingBudget) {
        await api.updateBudget(editingBudget.id, payload);
        showToast('Budget allocation updated successfully.', 'success', 'Saved');
      } else {
        await api.createBudget(payload);
        showToast('New budget cap created!', 'success', 'Budget Added');
      }
      setIsModalOpen(false);
      fetchBudgets();
      onRefresh();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBudget) return;
    setIsDeleting(true);
    try {
      await api.deleteBudget(deletingBudget.id);
      showToast('Budget removed successfully.', 'success', 'Deleted');
      setDeletingBudget(null);
      fetchBudgets();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete budget', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Budgets & Smart Alerts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Set monthly and category spending limits with real-time overspend alerts
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Budget</span>
        </button>
      </div>

      {/* Overview Status Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900">Safe (&lt; 80%)</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">Healthy spending rate comfortably within cap.</p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Warning (80% - 99%)</h4>
            <p className="text-[11px] text-amber-700 mt-0.5">Nearing ceiling. Recommended to slow expenses.</p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900">Exceeded (&ge; 100%)</h4>
            <p className="text-[11px] text-rose-700 mt-0.5">Over budget threshold. Requires adjustment.</p>
          </div>
        </div>
      </div>

      {/* Budgets List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
            <PieChart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-base font-bold text-slate-700">No active budgets defined</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Set New Budget" to define an overall monthly cap or category limits.
            </p>
          </div>
        ) : (
          budgets.map((b) => {
            const isCategorySpecific = !!b.category_id;
            const status = b.status;
            const percent = b.usage_percent;

            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-100 text-emerald-800';
            if (status === 'Exceeded') {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-100 text-rose-800';
            } else if (status === 'Warning') {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-100 text-amber-800';
            }

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-6 border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  status === 'Exceeded'
                    ? 'border-rose-200'
                    : status === 'Warning'
                    ? 'border-amber-200'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isCategorySpecific
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      {isCategorySpecific ? `Category: ${b.category_name}` : 'Overall Monthly Budget'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                        {status} ({percent}%)
                      </span>
                      <button
                        onClick={() => openEditModal(b)}
                        title="Edit Budget"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(b)}
                        title="Delete Budget"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spent</span>
                      <div className="text-xl font-black text-slate-900">
                        ₹{b.spent.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cap</span>
                      <div className="text-xl font-black text-slate-700">
                        ₹{b.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2 text-slate-500 font-medium">
                      <span>
                        Remaining:{' '}
                        <strong className={b.remaining === 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          ₹{b.remaining.toLocaleString('en-IN')}
                        </strong>
                      </span>
                      <span>{percent}% used</span>
                    </div>
                  </div>
                </div>

                {/* Date range footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {b.start_date} to {b.end_date}
                  </span>
                  <span className="font-mono text-[11px]">ID #{b.id}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBudget ? 'Edit Budget Target' : 'Create Budget Allocation'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Category selector (Optional: none = Overall Monthly Budget) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Budget Target *
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="">-- Overall Monthly Budget (All Expenses) --</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      Category: {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select a category or leave as Overall Monthly Budget to track total ceiling.
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Allocated Amount (₹) *
                </label>
                <div className="relative rounded-xl">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Save Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBudget}
        title="Delete Budget?"
        message={`Are you sure you want to remove this budget allocation of ₹${deletingBudget?.amount}? Existing transaction history will remain unchanged.`}
        confirmText="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBudget(null)}
      />
    </div>
  );
};
