import React, { useState } from 'react';

// Color palette for financial categories
const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // rose
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b'  // slate
];

/* --------------------------------------------------------------------------
   Chart 1: Expense by Category (Donut Chart)
   -------------------------------------------------------------------------- */
export const ExpenseCategoryDonut: React.FC<{
  data: Array<{ category: string; amount: number }>;
}> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p className="text-sm font-medium">No expense records found yet</p>
      </div>
    );
  }

  // Calculate SVG arc segments for donut
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = item.amount / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;
    const color = PALETTE[index % PALETTE.length];

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      color,
      index
    };
  });

  const activeItem = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => (
            <circle
              key={seg.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIndex === seg.index ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
          {activeItem ? (
            <>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeItem.category}</span>
              <span className="text-lg font-bold text-slate-800">₹{activeItem.amount.toLocaleString('en-IN')}</span>
              <span className="text-xs font-medium text-blue-600">{activeItem.percentage}%</span>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-lg font-bold text-slate-800">₹{total.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-500">{data.length} categories</span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {segments.map((seg) => (
          <div
            key={seg.category}
            onMouseEnter={() => setHoveredIndex(seg.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
              hoveredIndex === seg.index ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="truncate text-slate-700">{seg.category}</span>
            </div>
            <div className="flex items-center gap-2 text-right shrink-0">
              <span className="font-semibold text-slate-900">₹{seg.amount.toLocaleString('en-IN')}</span>
              <span className="text-slate-400">({seg.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Chart 2: Monthly Income vs Expense (Grouped Bar Chart)
   -------------------------------------------------------------------------- */
export const MonthlyTrendBarChart: React.FC<{
  data: Array<{ month: string; income: number; expense: number }>;
}> = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState<{ month: string; type: string; amount: number } | null>(null);

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
            <span>Expense</span>
          </div>
        </div>
        {hoveredBar && (
          <div className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {hoveredBar.month} {hoveredBar.type}: <span className="font-bold">₹{hoveredBar.amount.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      <div className="h-56 flex items-end justify-between gap-2 pt-6 border-b border-slate-200">
        {data.map((item) => {
          const incHeight = maxVal > 0 ? (item.income / maxVal) * 100 : 0;
          const expHeight = maxVal > 0 ? (item.expense / maxVal) * 100 : 0;

          return (
            <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-full px-1">
                {/* Income bar */}
                <div
                  className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all duration-200 cursor-pointer relative"
                  style={{ height: `${Math.max(incHeight, 4)}%` }}
                  onMouseEnter={() => setHoveredBar({ month: item.month, type: 'Income', amount: item.income })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                {/* Expense bar */}
                <div
                  className="w-1/2 max-w-[20px] bg-rose-500 hover:bg-rose-600 rounded-t transition-all duration-200 cursor-pointer relative"
                  style={{ height: `${Math.max(expHeight, 4)}%` }}
                  onMouseEnter={() => setHoveredBar({ month: item.month, type: 'Expense', amount: item.expense })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Chart 3: Weekly Spending Bar Chart
   -------------------------------------------------------------------------- */
export const WeeklySpendingChart: React.FC<{
  data: Array<{ day: string; date: string; amount: number }>;
}> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.amount), 500);

  return (
    <div className="space-y-4">
      <div className="h-44 flex items-end justify-between gap-2 pt-4 border-b border-slate-200">
        {data.map((item) => {
          const height = maxVal > 0 ? (item.amount / maxVal) * 100 : 0;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="text-[10px] font-semibold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{item.amount.toLocaleString('en-IN')}
              </div>
              <div className="w-full flex justify-center h-full items-end">
                <div
                  className="w-full max-w-[24px] bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-all duration-200"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 mt-2">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Chart 4: Budget Usage Radial Gauge
   -------------------------------------------------------------------------- */
export const BudgetUsageGauge: React.FC<{
  budget: number;
  used: number;
  remaining: number;
  percent: number;
}> = ({ budget, used, remaining, percent }) => {
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  let statusColor = '#10b981'; // emerald
  let statusText = 'Safe';
  let badgeClass = 'bg-emerald-100 text-emerald-800';

  if (percent >= 100) {
    statusColor = '#ef4444'; // rose
    statusText = 'Exceeded';
    badgeClass = 'bg-rose-100 text-rose-800';
  } else if (percent >= 80) {
    statusColor = '#f59e0b'; // amber
    statusText = 'Warning';
    badgeClass = 'bg-amber-100 text-amber-800';
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
      <div className="relative flex items-center justify-center">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900">{Math.round(percent)}%</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${badgeClass}`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm w-full max-w-xs">
        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Allocated Budget</span>
          <span className="font-bold text-slate-900">₹{budget.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Total Spent</span>
          <span className="font-bold text-rose-600">₹{used.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500">Remaining</span>
          <span className="font-bold text-emerald-600">₹{remaining.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Chart 5: Top Spending Categories (Ranked Horizontal Bars)
   -------------------------------------------------------------------------- */
export const TopSpendingCategoriesChart: React.FC<{
  data: Array<{ category: string; amount: number }>;
}> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.amount), 1);
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-400">No category spending recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentOfMax = (item.amount / maxVal) * 100;
        const percentOfTotal = total > 0 ? Math.round((item.amount / total) * 100) : 0;
        const color = PALETTE[idx % PALETTE.length];

        return (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {item.category}
              </span>
              <div className="flex gap-2">
                <span className="font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                <span className="text-slate-400">({percentOfTotal}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentOfMax}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
