import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavItem } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TransactionModal } from './components/TransactionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AddExpensePage } from './pages/AddExpensePage';
import { AddIncomePage } from './pages/AddIncomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { MonthlySummaryPage } from './pages/MonthlySummaryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SavingsPage } from './pages/SavingsPage';
import { VivaGuidePage } from './pages/VivaGuidePage';
import { Category, SmartAlert, Transaction, TransactionType } from './types';
import { api } from './services/api';
import { Wallet } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Global state & modals
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('Expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Delete transaction state
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Refresh counter to signal child components to re-fetch
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchGlobalData = async () => {
    if (!isAuthenticated) return;
    try {
      const [catList, dashData] = await Promise.all([
        api.getCategories(),
        api.getDashboard()
      ]);
      setCategories(catList);
      setAlerts(dashData.alerts || []);
    } catch (err) {
      console.warn('Error fetching global initial data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalData();
    }
  }, [isAuthenticated, refreshKey]);

  const handleTriggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const handleOpenAddExpense = () => {
    setEditingTx(null);
    setModalTxType('Expense');
    setIsTxModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    setEditingTx(null);
    setModalTxType('Income');
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setModalTxType(tx.transaction_type);
    setIsTxModalOpen(true);
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    setDeletingTx(tx);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deletingTx.id);
      showToast('Transaction deleted successfully.', 'success', 'Deleted');
      setDeletingTx(null);
      handleTriggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Loading screen while verifying token
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce shadow-xl">
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold mt-4">Smart Expense Tracker</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to SQLite Relational Engine...</p>
      </div>
    );
  }

  // 2. Unauthenticated screen: Login or Register
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  // 3. Authenticated Dashboard & Workspace
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 font-sans">
      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAddExpense={handleOpenAddExpense}
          onOpenAddIncome={handleOpenAddIncome}
          alerts={alerts}
          onRefreshData={handleTriggerRefresh}
        />

        <main className="flex-1 pb-12">
          {currentTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              categories={categories}
              onNavigate={setCurrentTab}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              key={refreshKey}
              categories={categories}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentTab === 'add-expense' && (
            <AddExpensePage
              categories={categories}
              onSuccess={handleTriggerRefresh}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'add-income' && (
            <AddIncomePage
              categories={categories}
              onSuccess={handleTriggerRefresh}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onRefresh={() => {
                fetchGlobalData();
                handleTriggerRefresh();
              }}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsPage
              categories={categories}
              onRefresh={() => {
                fetchGlobalData();
                handleTriggerRefresh();
              }}
            />
          )}

          {currentTab === 'monthly-summary' && (
            <MonthlySummaryPage key={refreshKey} />
          )}

          {currentTab === 'reports' && (
            <ReportsPage categories={categories} />
          )}

          {currentTab === 'savings' && (
            <SavingsPage key={refreshKey} />
          )}

          {currentTab === 'viva-guide' && (
            <VivaGuidePage />
          )}
        </main>
      </div>

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        initialType={modalTxType}
        editingTransaction={editingTx}
        categories={categories}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSuccess={handleTriggerRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTx}
        title="Delete Transaction?"
        message={`Are you sure you want to permanently delete transaction #${deletingTx?.id} ("${deletingTx?.description}" for ₹${deletingTx?.amount})? This operation cannot be undone.`}
        confirmText="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setDeletingTx(null)}
      />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
