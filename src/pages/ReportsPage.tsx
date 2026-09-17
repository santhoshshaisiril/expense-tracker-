import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { Category, CategoryReportData, Transaction } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';

interface ReportsPageProps {
  categories: Category[];
}

type ReportType = 'Expense' | 'Income' | 'Monthly' | 'Category';

export const ReportsPage: React.FC<ReportsPageProps> = ({ categories }) => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('Expense');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryReport, setCategoryReport] = useState<CategoryReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      if (reportType === 'Category') {
        const catData = await api.getCategoryReport(startDate, endDate);
        setCategoryReport(catData);
      } else {
        const params: Record<string, any> = {
          limit: 200,
          sort_by: 'transaction_date',
          sort_order: 'DESC'
        };

        if (reportType === 'Expense') params.type = 'Expense';
        if (reportType === 'Income') params.type = 'Income';
        if (selectedCategory !== 'All') params.category_id = selectedCategory;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res = await api.getTransactions(params);
        setTransactions(res.results);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch report data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate, selectedCategory]);

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);

  const handleExportCSV = () => {
    if (reportType === 'Category' && categoryReport) {
      const headers = ['Category ID', 'Category Name', 'Transaction Count', 'Total Spending (INR)', 'Percentage (%)'];
      const rows = categoryReport.categories.map(c => [
        c.category_id,
        `"${c.category_name}"`,
        c.transaction_count,
        c.total_spending,
        `${c.percentage}%`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile(csv, `category_report_${Date.now()}.csv`, 'text/csv');
      showToast('Category Report exported to CSV', 'success');
      return;
    }

    if (transactions.length === 0) {
      showToast('No records available to export', 'warning');
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

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, `${reportType.toLowerCase()}_report_${Date.now()}.csv`, 'text/csv');
    showToast(`${reportType} Report exported to CSV`, 'success');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const title = `Smart Expense Tracker - ${reportType} Report`;
      const dateStr = `Generated on: ${new Date().toLocaleDateString('en-IN')}`;

      // Header styling
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(title, 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(dateStr, 14, 30);
      doc.text(`Scope: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 14, 36);

      let startY = 46;

      if (reportType === 'Category' && categoryReport) {
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Expenditure: Rs. ${categoryReport.total_expenses.toLocaleString('en-IN')}`, 14, startY);
        startY += 10;

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Category', 14, startY);
        doc.text('Count', 80, startY);
        doc.text('Amount (Rs)', 120, startY);
        doc.text('Share (%)', 170, startY);

        startY += 4;
        doc.line(14, startY, 195, startY);
        startY += 6;

        categoryReport.categories.forEach(item => {
          if (startY > 280) {
            doc.addPage();
            startY = 20;
          }
          doc.text(item.category_name, 14, startY);
          doc.text(String(item.transaction_count), 80, startY);
          doc.text(item.total_spending.toLocaleString('en-IN'), 120, startY);
          doc.text(`${item.percentage}%`, 170, startY);
          startY += 7;
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Volume: Rs. ${totalAmount.toLocaleString('en-IN')} (${transactions.length} entries)`, 14, startY);
        startY += 10;

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Date', 14, startY);
        doc.text('Type', 36, startY);
        doc.text('Category', 60, startY);
        doc.text('Description', 105, startY);
        doc.text('Amount (Rs)', 165, startY);

        startY += 4;
        doc.line(14, startY, 195, startY);
        startY += 6;

        transactions.slice(0, 35).forEach(tx => {
          if (startY > 280) {
            doc.addPage();
            startY = 20;
          }
          doc.text(tx.transaction_date, 14, startY);
          doc.text(tx.transaction_type, 36, startY);
          doc.text(tx.category_name.slice(0, 18), 60, startY);
          doc.text(tx.description.slice(0, 24), 105, startY);
          doc.text(tx.amount.toLocaleString('en-IN'), 165, startY);
          startY += 7;
        });
      }

      doc.save(`${reportType.toLowerCase()}_report.pdf`);
      showToast('PDF Document generated successfully!', 'success', 'PDF Ready');
    } catch (err) {
      console.error('PDF Generation error:', err);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Export</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate formal Expense, Income, Monthly, and Category reports with CSV, PDF, and print layouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto print:hidden">
        {(['Expense', 'Income', 'Monthly', 'Category'] as ReportType[]).map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              reportType === type
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {type} Report
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Start Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">End Date:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>

        {reportType !== 'Category' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(startDate || endDate || selectedCategory !== 'All') && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedCategory('All');
            }}
            className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Smart Expense Tracker</h1>
            <h3 className="text-sm font-bold text-slate-600 mt-0.5">
              Official {reportType} Statement
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Date Range: {startDate || 'Start of Ledger'} to {endDate || 'Current Date'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
            <div className="text-2xl font-black text-slate-900">
              ₹{(reportType === 'Category' ? categoryReport?.total_expenses : totalAmount)?.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400">Currency in INR (₹)</p>
          </div>
        </div>

        {/* Content depending on Report Type */}
        {reportType === 'Category' ? (
          <div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3 text-center">Transactions</th>
                  <th className="px-4 py-3 text-right">Total Outlay (₹)</th>
                  <th className="px-4 py-3 text-right">Proportion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!categoryReport || categoryReport.categories.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No category records found for this period.
                    </td>
                  </tr>
                ) : (
                  categoryReport.categories.map(item => (
                    <tr key={item.category_id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.category_name}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{item.transaction_count}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₹{item.total_spending.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-blue-600 text-xs">{item.percentage}%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No matching records found for this criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const isInc = tx.transaction_type === 'Income';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-xs text-slate-500">{tx.transaction_date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{tx.category_name}</td>
                        <td className="px-4 py-3 text-slate-900">{tx.description}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{tx.payment_method}</td>
                        <td className={`px-4 py-3 text-right font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isInc ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info for reports */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Smart Expense Tracker &bull; Relational Database Certified Ledger</span>
          <span>Generated by Antigravity Core</span>
        </div>
      </div>
    </div>
  );
};
