import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Target,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { DashboardData } from '../types';
import { api } from '../services/api';

export const SavingsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

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

  const savingsRate = summary.savings_percentage || 0;
  let healthScore = 'Excellent';
  let healthBadge = 'bg-emerald-100 text-emerald-800';
  let healthDesc = 'Your savings rate exceeds the recommended 20% threshold. You are building durable wealth!';

  if (savingsRate < 0) {
    healthScore = 'Deficit';
    healthBadge = 'bg-rose-100 text-rose-800';
    healthDesc = 'Expenses currently exceed your earnings. Prioritize reducing discretionary shopping & dining.';
  } else if (savingsRate < 10) {
    healthScore = 'Needs Attention';
    healthBadge = 'bg-amber-100 text-amber-800';
    healthDesc = 'Your savings rate is below 10%. Aim to put away at least 20% into an emergency fund.';
  } else if (savingsRate < 20) {
    healthScore = 'Fair';
    healthBadge = 'bg-blue-100 text-blue-800';
    healthDesc = 'You are saving a positive portion of your income, but can increase your rate to 20-30%.';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
          <PiggyBank className="w-3.5 h-3.5" />
          Wealth & Savings Engine
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Savings & Wealth Tracker</h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your net capital retention, 50-30-20 rule compliance, and financial health score
        </p>
      </div>

      {/* Core Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Net Savings</span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-600 mt-3">
            ₹{summary.savings.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total Income minus Total Expenses</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Savings Rate</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 mt-3">
            {savingsRate}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Percentage of income retained</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Financial Rating</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-extrabold ${healthBadge}`}>
              {healthScore}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 line-clamp-1">{healthDesc}</p>
        </div>
      </div>

      {/* 50-30-20 Rule Analysis Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">50 / 30 / 20 Budgeting Rule Analysis</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          The classical financial benchmark suggests allocating 50% of income toward Essentials (Needs), 30% toward Lifestyle (Wants), and 20% toward Savings & Debt payoff.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase">50% Needs Target</h4>
            <div className="text-xl font-black text-slate-900 mt-1">
              ₹{(summary.total_income * 0.5).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Rent, groceries, utilities, transit</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase">30% Wants Target</h4>
            <div className="text-xl font-black text-slate-900 mt-1">
              ₹{(summary.total_income * 0.3).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Dining out, entertainment, shopping</p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
            <h4 className="text-xs font-bold text-teal-800 uppercase">20% Savings Target</h4>
            <div className="text-xl font-black text-teal-700 mt-1">
              ₹{(summary.total_income * 0.2).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-teal-600 mt-1">Emergency reserves & investments</p>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400">
          <Lightbulb className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Smart Financial Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Set Category Alerts</strong>
              Define specific budget caps for food and entertainment to receive warnings before you exceed your comfort threshold.
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Automate Monthly Allocations</strong>
              Whenever income is logged, immediately set aside ₹{(summary.monthly_income * 0.2).toLocaleString('en-IN')} before logging optional expenses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
