import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  LogOut,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SmartAlert } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface NavbarProps {
  onOpenSidebar: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  alerts?: SmartAlert[];
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  onOpenAddExpense,
  onOpenAddIncome,
  alerts = [],
  onRefreshData
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemoData = async () => {
    if (!confirm('Reset all demo transactions, categories, and budgets to default sample data?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      showToast(res.message, 'success', 'Data Restored');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">Welcome back,</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
              {user?.full_name || 'Rahul Sharma'}
            </h2>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Reset for Viva */}
          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            title="Reset to fresh demo sample data (helpful for viva demonstration)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>

          {/* Quick Add Income button */}
          <button
            onClick={onOpenAddIncome}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ Income</span>
          </button>

          {/* Quick Add Expense button */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          {/* Smart Budget Alerts Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertsDropdown(!showAlertsDropdown);
                setShowUserDropdown(false);
              }}
              className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                alerts.length > 0
                  ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-800">Smart Budget Alerts</h4>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {alerts.length} Active
                  </span>
                </div>

                <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                      <p className="text-xs font-semibold text-slate-700">All Budgets Within Limit</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No spending warnings or overages detected.</p>
                    </div>
                  ) : (
                    alerts.map(a => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border text-xs ${
                          a.level === 'danger'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : 'bg-amber-50/70 border-amber-200 text-amber-900'
                        }`}
                      >
                        <p className="font-bold">{a.title}</p>
                        <p className="mt-1 leading-relaxed text-slate-600">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowAlertsDropdown(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleResetDemoData();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    Reset Demo Ledger
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
