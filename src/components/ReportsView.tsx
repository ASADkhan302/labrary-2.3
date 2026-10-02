import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import { Book, Borrower, Transaction, NavigationTab } from '../types/library';
import { LibraryStorage } from '../services/storage';
import { Dashboard } from '@/components/ui/dashboard-4';
import { SystemLimitsAuditPanel } from './SystemLimitsAuditPanel';

interface ReportsViewProps {
  books: Book[];
  borrowers: Borrower[];
  transactions: Transaction[];
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  books,
  borrowers,
  transactions,
  onNavigateTab,
}) => {
  const activeBooks = useMemo(() => books.filter(b => b.is_active), [books]);
  const activeBorrowers = useMemo(() => borrowers.filter(b => b.is_active), [borrowers]);
  
  const totalTitles = activeBooks.length;
  const totalCopies = activeBooks.reduce((s, b) => s + b.total_quantity, 0);
  const totalAvailable = activeBooks.reduce((s, b) => s + b.available_quantity, 0);
  const totalIssued = totalCopies - totalAvailable;

  const todayStr = new Date().toISOString().split('T')[0];
  const totalOverdue = transactions.filter(t => t.status === 'OVERDUE' || (t.status === 'ACTIVE' && t.due_date < todayStr)).length;

  // Breakdown by Category
  const categoryStats = useMemo(() => {
    const map = new Map<string, { titles: number; copies: number; available: number }>();
    activeBooks.forEach(b => {
      const cur = map.get(b.category) || { titles: 0, copies: 0, available: 0 };
      cur.titles += 1;
      cur.copies += b.total_quantity;
      cur.available += b.available_quantity;
      map.set(b.category, cur);
    });
    return Array.from(map.entries()).map(([category, stats]) => ({
      category,
      ...stats,
      issued: stats.copies - stats.available,
    }));
  }, [activeBooks]);

  // Breakdown by Department
  const deptStats = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.status !== 'RETURNED') {
        const bor = borrowers.find(b => b.id === t.borrower_id);
        const dept = bor ? bor.department : 'General';
        map.set(dept, (map.get(dept) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([dept, count]) => ({ dept, count }));
  }, [transactions, borrowers]);

  const handleExportSummaryCsv = () => {
    const exportData = categoryStats.map(c => ({
      Category: c.category,
      Titles: c.titles,
      TotalCopies: c.copies,
      AvailableCopies: c.available,
      IssuedCopies: c.issued,
      UtilizationRate: `${Math.round((c.issued / (c.copies || 1)) * 100)}%`,
    }));
    LibraryStorage.exportCsv(exportData, `ULM_Library_Analytics_${todayStr}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Header & Export Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>Campus Library Analytics & Inventory Audit</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live statistics derived from the local SQLite storage engine for University of Lakki Marwat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSummaryCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        {/* Shadcn Recharts Dashboard Component (Stats, Circulation Volume, Return Rate, Category Rank) */}
        <Dashboard 
          totalBooks={totalTitles}
          totalCopies={totalCopies}
          activeLoans={totalIssued}
          overdueLoans={totalOverdue}
          books={activeBooks}
          borrowers={activeBorrowers}
          transactions={transactions}
        />

        {/* Charts & Distribution Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Breakdown 1: Books by Category */}
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-[#F1F5F9]">Holdings Distribution by Academic Discipline</h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{totalCopies} physical copies</span>
            </div>

            <div className="space-y-3 pt-1">
              {categoryStats.map(stat => {
                const percentage = totalCopies > 0 ? Math.round((stat.copies / totalCopies) * 100) : 0;
                return (
                  <div key={stat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{stat.category}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {stat.copies} copies ({percentage}%) · {stat.available} on shelf
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex">
                      <div
                        className="h-full bg-amber-500 rounded-l"
                        style={{ width: `${(stat.issued / (stat.copies || 1)) * percentage}%` }}
                        title={`${stat.issued} issued`}
                      />
                      <div
                        className="h-full bg-emerald-500 rounded-r"
                        style={{ width: `${(stat.available / (stat.copies || 1)) * percentage}%` }}
                        title={`${stat.available} available`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#1E293B]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Available on Shelf</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                <span>Currently Issued</span>
              </div>
            </div>
          </div>

          {/* Breakdown 2: Circulation by Department */}
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-[#F1F5F9]">Active Borrowing by Department</h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{totalIssued} active loans</span>
            </div>

            <div className="space-y-3 pt-1">
              {deptStats.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No active loans currently.</p>
              ) : (
                deptStats.map(stat => {
                  const pct = totalIssued > 0 ? Math.round((stat.count / totalIssued) * 100) : 0;
                  return (
                    <div key={stat.dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{stat.dept}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {stat.count} {stat.count === 1 ? 'loan' : 'loans'} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div
                          className="h-full bg-amber-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Overdue Audit Notice Card */}
            <div className="mt-4 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-rose-800 dark:text-rose-300">Overdue Audit Notice ({totalOverdue} Accounts)</p>
                <p className="text-rose-700/80 dark:text-rose-400/80">
                  Campus policy generates automated email notices after 14 days overdue. Circulation desk retains return validation rights.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* COMPREHENSIVE SYSTEM BOUNDARIES & LIMITS LIVE AUDIT PANEL */}
        <SystemLimitsAuditPanel />

      </div>
    </div>
  );
};
export default ReportsView;
