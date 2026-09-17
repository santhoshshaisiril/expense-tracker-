import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit2,
  Trash2,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CreditCard,
  Tag
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface TransactionsPageProps {
  categories: Category[];
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  categories,
  onOpenAddExpense,
  onOpenAddIncome,
  onEditTransaction
}) => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('transaction_date');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Modals state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchTransactions = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'All') params.type = typeFilter;
      if (categoryFilter !== 'All') params.category_id = categoryFilter;
      if (paymentFilter !== 'All') params.payment_method = paymentFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;

      const res = await api.getTransactions(params);
      setTransactions(res.results);
      setTotalCount(res.total);
      setTotalPages(res.total_pages);
      setCurrentPage(res.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [typeFilter, categoryFilter, paymentFilter, sortBy, sortOrder, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setCategoryFilter('All');
    setPaymentFilter('All');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('transaction_date');
    setSortOrder('DESC');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deletingTx.id);
      showToast('Transaction deleted successfully.', 'success', 'Deleted');
      setDeletingTx(null);
      fetchTransactions(currentPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }

    const headers = ['ID', 'Type', 'Amount (INR)', 'Category', 'Description', 'Payment Method', 'Date', 'Notes'];
    const rows = transactions.map(t => [
      t.id,
      t.transaction_type,
      t.amount,
      `"${t.category_name}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.payment_method}"`,
      t.transaction_date,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported filtered transactions as CSV.', 'success', 'Export Complete');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transactions Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, view details, edit, and export your entire financial ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
          >
            + Income
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description, notes, category, payment method, or amount..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              title="Reset all filters"
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Types</option>
                <option value="Expense">Expense Only</option>
                <option value="Income">Income Only</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="transaction_date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="created_at">Date Created</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="w-1/3 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="DESC">Desc</option>
                  <option value="ASC">Asc</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            {/* Min Amount & Max Amount */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Min Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Max Amount (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div className="col-span-full flex justify-end">
              <button
                type="button"
                onClick={() => fetchTransactions(1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isInc = tx.transaction_type === 'Income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">#{tx.id}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isInc ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        {tx.category_name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-900 font-medium max-w-xs">
                        <div className="truncate font-semibold">{tx.description}</div>
                        {tx.notes && <div className="text-[11px] text-slate-400 truncate mt-0.5">{tx.notes}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{tx.transaction_date}</td>
                      <td className={`px-5 py-3.5 text-right font-extrabold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaction"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTx(tx)}
                            title="Delete Transaction"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={limit}
              onChange={e => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>of {totalCount} transactions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  const p = currentPage - 1;
                  setCurrentPage(p);
                  fetchTransactions(p);
                }
              }}
              disabled={currentPage <= 1 || isLoading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  const p = currentPage + 1;
                  setCurrentPage(p);
                  fetchTransactions(p);
                }
              }}
              disabled={currentPage >= totalPages || isLoading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={(tx) => {
          setSelectedTx(null);
          onEditTransaction(tx);
        }}
        onDelete={(tx) => {
          setSelectedTx(null);
          setDeletingTx(tx);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTx}
        title="Delete Transaction?"
        message={`Are you sure you want to delete transaction #${deletingTx?.id} ("${deletingTx?.description}" - ₹${deletingTx?.amount})? This will update your balances and SQLite database immediately.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTx(null)}
      />
    </div>
  );
};
