import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Database,
  Server,
  Code2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Terminal,
  RotateCcw,
  ShieldCheck,
  Send,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const VivaGuidePage: React.FC = () => {
  const { showToast } = useToast();
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [apiTestEndpoint, setApiTestEndpoint] = useState('/dashboard/');
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [isTestingApi, setIsTestingApi] = useState(false);

  const fetchSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const data = await api.inspectSchema();
      setSchemaInfo(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to inspect schema', 'error');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestResult('Executing REST call with Bearer JWT...');
    try {
      const token = localStorage.getItem('smart_expense_token');
      const res = await fetch(`/api${apiTestEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setApiTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiTestResult(`Error: ${err.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const vivaQuestions = [
    {
      q: 'What is the high-level architecture of this Smart Expense Tracker?',
      a: 'This application follows a robust Full-Stack 3-Tier Client-Server Architecture. The presentation layer is built in modern React with TypeScript and Tailwind CSS. The Application Layer consists of RESTful API endpoints handling business logic, transaction calculations, and JWT authentication. The Data Tier is backed by a relational SQLite database with strict foreign keys, constraints, and ACID transactions.'
    },
    {
      q: 'How is User Authentication and Authorization implemented?',
      a: 'Authentication is implemented using JSON Web Tokens (JWT) and industry-standard salted hashing (bcrypt). When a user registers or logs in, the backend validates credentials, signs a stateless JWT containing the user identity, and returns it to the client. The client attaches this token in the `Authorization: Bearer <token>` header for all protected endpoints. An authentication middleware verifies the token signature on every protected request.'
    },
    {
      q: 'How does the database enforce data integrity between Categories and Transactions?',
      a: 'Referential integrity is guaranteed through foreign key constraints (`category_id REFERENCES categories(id)` and `user_id REFERENCES users(id)`). Furthermore, in the backend route handlers and models, attempts to delete a category that currently has associated transactions are rejected with an explicit HTTP 400 Conflict error, ensuring orphaned transaction records can never occur.'
    },
    {
      q: 'How are the Smart Budget Alerts computed?',
      a: 'The system queries the `budgets` table and joins with the `transactions` table within the active date range (`start_date` to `end_date`). Spending is aggregated per budget. If spending is between 80% and 99% of the budget amount, a "Warning" alert (amber) is generated. If spending reaches or exceeds 100%, an "Exceeded" danger alert (rose) is flagged in real-time.'
    },
    {
      q: 'How does the application prevent SQL Injection?',
      a: 'All SQL queries are executed using parameterized statements (placeholders `?` in SQLite and ORM QuerySets in Django), which separate the SQL command structure from user-supplied parameters. User input is never concatenated directly into raw query strings.'
    },
    {
      q: 'What is the difference between client-side state and database persistence?',
      a: 'Client-side state (React state / localStorage) holds temporary session data (such as active UI filters and the current JWT token). In contrast, all persistent ledger entities (transactions, categories, budgets, and user accounts) are stored in the server-side relational database. If the browser is refreshed or reopened on another device, all data is loaded afresh from the database.'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mb-2">
          <GraduationCap className="w-4 h-4" />
          Academic Viva & Demonstration Toolkit
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          College Viva Defense & System Inspector
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Live relational schema inspection, real-time REST API probe, and comprehensive viva Q&A for project presentation
        </p>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Project Summary & Demonstration Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-slate-400 font-bold uppercase text-[10px]">Project Title</p>
            <p className="text-base font-extrabold text-slate-900">Smart Expense Tracker</p>
            <p className="text-slate-500">Tagline: <em>"Track. Analyze. Save Smarter."</em></p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-slate-400 font-bold uppercase text-[10px]">Architecture Pattern</p>
            <p className="text-base font-extrabold text-slate-900">Full-Stack REST Architecture</p>
            <p className="text-slate-500">React + TypeScript SPA &bull; Express/Django REST API &bull; Relational SQLite</p>
          </div>
        </div>
      </div>

      {/* 1. Live Database Schema Inspector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live Database Schema Inspector</h3>
              <p className="text-xs text-slate-400">Direct query of SQL table definitions and live row counts</p>
            </div>
          </div>
          <button
            onClick={fetchSchema}
            disabled={isLoadingSchema}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSchema ? 'animate-spin' : ''}`} />
            Refresh Schema
          </button>
        </div>

        {schemaInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {Object.entries(schemaInfo.tables || {}).map(([table, details]: [string, any]) => (
              <div key={table} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 uppercase">{table}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {details.count} Rows
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  {details.columns.map((c: any) => (
                    <div key={c.name} className="flex justify-between font-mono">
                      <span className={c.pk ? 'font-bold text-amber-700' : 'text-slate-600'}>
                        {c.name} {c.pk ? '🔑' : ''}
                      </span>
                      <span className="text-slate-400 text-[10px]">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Interactive REST API Console */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live REST API Probe Console</h3>
            <p className="text-xs text-slate-400">Test backend endpoints with live JWT authorization headers</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center bg-slate-100 rounded-xl px-3 border border-slate-200">
            <span className="font-mono text-xs text-slate-500 font-bold mr-2">GET /api</span>
            <input
              type="text"
              value={apiTestEndpoint}
              onChange={e => setApiTestEndpoint(e.target.value)}
              className="flex-1 py-2 text-xs font-mono text-slate-900 bg-transparent outline-hidden"
              placeholder="/dashboard/ or /transactions/ or /categories/"
            />
          </div>
          <button
            onClick={handleTestApi}
            disabled={isTestingApi}
            className="flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Request</span>
          </button>
        </div>

        {apiTestResult && (
          <div className="mt-2 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-60">
            <pre>{apiTestResult}</pre>
          </div>
        )}
      </div>

      {/* 3. Common College Viva Q&A */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">College Viva Questions & Model Answers</h3>
        </div>
        <p className="text-xs text-slate-400">
          Prepared answers to examiners' questions for full-stack project viva
        </p>

        <div className="space-y-3 pt-2">
          {vivaQuestions.map((item, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div
                key={index}
                className="border border-slate-200/80 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    {item.q}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
