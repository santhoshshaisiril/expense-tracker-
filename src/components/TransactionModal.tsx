import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, IndianRupee } from 'lucide-react';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface TransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType = 'Expense',
  editingTransaction = null,
  categories,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setTransactionType(editingTransaction.transaction_type);
      setAmount(String(editingTransaction.amount));
      setCategoryId(String(editingTransaction.category_id));
      setDescription(editingTransaction.description);
      setPaymentMethod(editingTransaction.payment_method);
      setTransactionDate(editingTransaction.transaction_date);
      setNotes(editingTransaction.notes || '');
    } else {
      setTransactionType(initialType);
      setAmount('');
      setDescription('');
      setNotes('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
    }
    setErrors({});
  }, [editingTransaction, initialType, isOpen]);

  // Set default category when type changes
  const filteredCategories = categories.filter(c => c.category_type === transactionType);

  useEffect(() => {
    if (!editingTransaction && filteredCategories.length > 0) {
      // Check if current categoryId is in filtered
      const exists = filteredCategories.some(c => String(c.id) === categoryId);
      if (!exists) {
        setCategoryId(String(filteredCategories[0].id));
      }
    }
  }, [transactionType, categories, editingTransaction]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Amount is required and must be greater than zero.';
    }
    if (!categoryId) {
      errs.category = 'Please select a category.';
    }
    if (!description.trim()) {
      errs.description = 'Description is required.';
    } else if (description.trim().length > 150) {
      errs.description = 'Description cannot exceed 150 characters.';
    }
    if (!paymentMethod) {
      errs.paymentMethod = 'Please choose a payment method.';
    }
    if (!transactionDate) {
      errs.date = 'Invalid date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        transaction_type: transactionType,
        amount: parseFloat(amount),
        category_id: Number(categoryId),
        description: description.trim(),
        payment_method: paymentMethod,
        transaction_date: transactionDate,
        notes: notes.trim()
      };

      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, payload);
        showToast('Transaction updated successfully!', 'success', 'Saved');
      } else {
        await api.createTransaction(payload);
        showToast(`${transactionType} of ₹${parseFloat(amount).toLocaleString('en-IN')} added!`, 'success', 'Recorded');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save transaction', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountPresets = transactionType === 'Expense' ? [100, 250, 500, 1000, 2000] : [5000, 10000, 25000, 50000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 my-8 transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaction' : `Add New ${transactionType}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingTransaction
                ? `Update details for transaction #${editingTransaction.id}`
                : 'Enter details below to log to your financial ledger'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type Toggle (Disabled during edit to maintain consistency) */}
          {!editingTransaction && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTransactionType('Expense')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  transactionType === 'Expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('Income')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  transactionType === 'Income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Income
              </button>
            </div>
          )}

          {/* Amount input & presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (₹) *
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden ${
                  errors.amount ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>}

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Presets:</span>
              {amountPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden ${
                errors.category ? 'border-rose-400' : 'border-slate-200'
              }`}
            >
              <option value="">-- Select Category --</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.description ? `(${cat.description})` : ''}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={transactionType === 'Expense' ? 'e.g. Lunch at Cafe, Grocery items' : 'e.g. Monthly salary, Freelance design gig'}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden ${
                errors.description ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
          </div>

          {/* Payment Method & Date in two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden ${
                  errors.date ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional details, invoice number, or memo..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer ${
                transactionType === 'Income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isSubmitting ? 'Saving...' : (editingTransaction ? 'Update Transaction' : `Save ${transactionType}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
