import React from 'react';
import { X, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Calendar, CreditCard, Tag, FileText, Clock, Hash } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.transaction_type === 'Income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              #{transaction.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {transaction.transaction_type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Amount Display */}
        <div className="my-6 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Transaction Amount
          </p>
          <h2
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isIncome ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {isIncome ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
          </h2>
          <p className="text-base font-semibold text-slate-700 mt-2 px-4 truncate">
            {transaction.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 text-xs">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Category
            </span>
            <span className="font-semibold text-slate-800">{transaction.category_name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 text-xs">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
            </span>
            <span className="font-semibold text-slate-800">{transaction.payment_method}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Transaction Date
            </span>
            <span className="font-semibold text-slate-800">{transaction.transaction_date}</span>
          </div>

          {transaction.notes && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes
              </span>
              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {transaction.notes}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Logged at
            </span>
            <span>{transaction.created_at || 'Just now'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              onClose();
              onDelete(transaction);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold text-sm transition-colors border border-rose-200 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
