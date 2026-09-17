import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  TrendingUp,
  Tags,
  PieChart,
  CalendarCheck,
  FileBarChart,
  PiggyBank,
  GraduationCap,
  LogOut,
  X,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'transactions'
  | 'add-expense'
  | 'add-income'
  | 'categories'
  | 'budgets'
  | 'monthly-summary'
  | 'reports'
  | 'savings'
  | 'viva-guide';

interface SidebarProps {
  currentTab: NavItem;
  setCurrentTab: (tab: NavItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose
}) => {
  const { user, logout } = useAuth();

  const navItems: Array<{ id: NavItem; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'add-expense', label: 'Add Expense', icon: PlusCircle },
    { id: 'add-income', label: 'Add Income', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'budgets', label: 'Budgets & Alerts', icon: PieChart },
    { id: 'monthly-summary', label: 'Monthly Summary', icon: CalendarCheck },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'savings', label: 'Savings Tracker', icon: PiggyBank },
    { id: 'viva-guide', label: 'College Viva & APIs', icon: GraduationCap, badge: 'Viva' }
  ];

  const handleSelect = (id: NavItem) => {
    setCurrentTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelect('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none text-base">Smart Expense</h1>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Track. Analyze. Save.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
