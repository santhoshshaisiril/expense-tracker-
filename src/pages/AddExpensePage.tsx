import React, { useState } from 'react';
import { ArrowDownRight, IndianRupee, Check, PlusCircle, Tag, Calendar, CreditCard, FileText } from 'lucide-react';
import { Category, PaymentMethod } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AddExpensePageProps {
  categories: Category[];
  onSuccess: () => void;
  onNavigate: (tab: any) => void;
}

const PRESETS = [100, 250, 500, 1000, 2000, 5000];
const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

export const AddExpensePage: React.FC<AddExpensePageProps> = ({
  categories,
  onSuccess,
  onNavigate
}) => {
  const { showToast } = useToast();
  const expenseCategories = categories.filter(c => c.category_type === 'Expense');

  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(expenseCategories[0]?.id ? String(expenseCategories[0].id) : '');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      errs.amount = 'Valid positive amount is required.';
    }
    if (!categoryId) {
      errs.category = 'Expense category is required.';
    }
    if (!description.trim()) {
      errs.description = 'Description is required.';
    }
    if (!date) {
      errs.date = 'Date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.createTransaction({
        transaction_type: 'Expense',
        amount: parseFloat(amount),
        category_id: Number(categoryId),
        description: description.trim(),
        payment_method: paymentMethod,
        transaction_date: date,
        notes: notes.trim()
      });
      showToast(`Expense of ₹${parseFloat(amount).toLocaleString('en-IN')} added successfully!`, 'success', 'Expense Recorded');
      onSuccess();
      onNavigate('transactions');
    } catch (err: any) {
      showToast(err.message || 'Failed to add expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-2">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Outgoing Money
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Record New Expense</h2>
          <p className="text-sm text-slate-500 mt-1">Log a personal or business expense directly into your SQLite ledger</p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Expense Amount (₹) *
            </label>
            <div className="relative rounded-2xl">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-extrabold text-2xl">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-2xl font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-hidden transition-all ${
                  errors.amount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.amount}</p>}

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-slate-400 self-center mr-1">Quick Select:</span>
              {PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-colors cursor-pointer"
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Category *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden ${
                  errors.category ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">-- Choose Category --</option>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.description ? `(${c.description})` : ''}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description / Merchant *
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Swiggy food delivery, Metro card reload"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden ${
                  errors.description ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden ${
                  errors.date ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Additional Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add bill reference, memo, or transaction remarks..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 rounded-xl transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving to Database...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
