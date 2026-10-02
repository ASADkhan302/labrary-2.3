import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  User, 
  BookOpen, 
  Barcode as BarcodeIcon,
  PlusCircle,
  Clock,
  LayoutGrid,
  List,
  Calendar,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { Transaction, Book, Borrower } from '../types/library';
import CustomSelect from './ui/CustomSelect';

interface CirculationDeskProps {
  transactions: Transaction[];
  books: Book[];
  borrowers: Borrower[];
  onIssueBook: (bookId: string, borrowerId: string, days: number) => { success: boolean; message: string } | void;
  onReturnBook: (transactionId: string) => void;
  onOpenBookDetails: (bookId: string) => void;
  onOpenBorrowerDetails: (borrowerId: string) => void;
}

export const CirculationDeskView: React.FC<CirculationDeskProps> = ({
  transactions,
  books,
  borrowers,
  onIssueBook,
  onReturnBook,
  onOpenBookDetails,
  onOpenBorrowerDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Issue modal/form inline controls
  const [isIssuing, setIsIssuing] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [loanPeriodDays, setLoanPeriodDays] = useState(14);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueButtonState, setIssueButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [returningTxState, setReturningTxState] = useState<Record<string, 'loading' | 'success'>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  // Active available books for issue
  const availableBooks = useMemo(() => {
    return books.filter(b => b.is_active && b.available_quantity > 0);
  }, [books]);

  // Active borrowers
  const activeBorrowers = useMemo(() => {
    return borrowers.filter(b => b.is_active);
  }, [borrowers]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        (t.book_name && t.book_name.toLowerCase().includes(query)) ||
        (t.borrower_name && t.borrower_name.toLowerCase().includes(query)) ||
        (t.barcode && t.barcode.toLowerCase().includes(query)) ||
        (t.student_id && t.student_id.toLowerCase().includes(query));

      const isOverdue = t.status === 'OVERDUE' || (t.status === 'ACTIVE' && t.due_date < todayStr);

      if (statusFilter === 'ALL') return matchesQuery;
      if (statusFilter === 'OVERDUE') return matchesQuery && isOverdue;
      if (statusFilter === 'ACTIVE') return matchesQuery && t.status === 'ACTIVE' && !isOverdue;
      if (statusFilter === 'RETURNED') return matchesQuery && t.status === 'RETURNED';
      return matchesQuery;
    });
  }, [transactions, searchQuery, statusFilter, todayStr]);

  const activeLoansCount = useMemo(() => {
    return transactions.filter(t => t.status === 'ACTIVE' && t.due_date >= todayStr).length;
  }, [transactions, todayStr]);

  const overdueCount = useMemo(() => {
    return transactions.filter(t => t.status === 'OVERDUE' || (t.status === 'ACTIVE' && t.due_date < todayStr)).length;
  }, [transactions, todayStr]);

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      setIssueError('Please select a book title with available shelf copies.');
      return;
    }
    if (!selectedBorrowerId) {
      setIssueError('Please select a registered library member.');
      return;
    }

    setIssueButtonState('loading');
    setTimeout(() => {
      const res = onIssueBook(selectedBookId, selectedBorrowerId, loanPeriodDays);
      if (res && !res.success) {
        setIssueError(res.message);
        setIssueButtonState('idle');
        return;
      }

      setIssueButtonState('success');
      setTimeout(() => {
        setSelectedBookId('');
        setSelectedBorrowerId('');
        setIsIssuing(false);
        setIssueError(null);
        setIssueButtonState('idle');
      }, 1200);
    }, 200);
  };

  const handleReturnAction = (transactionId: string) => {
    setReturningTxState(prev => ({ ...prev, [transactionId]: 'loading' }));
    setTimeout(() => {
      setReturningTxState(prev => ({ ...prev, [transactionId]: 'success' }));
      setTimeout(() => {
        onReturnBook(transactionId);
        setReturningTxState(prev => {
          const next = { ...prev };
          delete next[transactionId];
          return next;
        });
      }, 1200);
    }, 200);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Header & Quick Issue Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              <span>Circulation Desk & Loan Registry</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Process campus checkouts, returns, loan renewals, and overdue records.
            </p>
          </div>

          <button
            onClick={() => {
              setIsIssuing(!isIssuing);
              setIssueError(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isIssuing ? 'Cancel Issue' : 'Issue Book to Member'}</span>
          </button>
        </div>

        {/* Issue Drawer Form */}
        {isIssuing && (
          <form 
            onSubmit={handleCreateIssue}
            className="bg-[#020617] border border-amber-500/40 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-[#F1F5F9] font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>New Book Issue Transaction</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Auto-updates catalog stock
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsIssuing(false);
                    setIssueError(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Issue Form"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {issueError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Select Book */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Select Book Title (Available Stock) <span className="text-amber-500">*</span>
                </label>
                <CustomSelect
                  value={selectedBookId}
                  onChange={(val) => setSelectedBookId(val)}
                  placeholder="-- Choose Book from Stacks --"
                  options={availableBooks.map(b => ({
                    value: b.id,
                    label: b.book_name,
                    sublabel: `${b.barcode} · ${b.author}`,
                    badge: `${b.available_quantity} Avail`
                  }))}
                  searchable
                />
              </div>

              {/* Select Borrower */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Select Borrower (Member) <span className="text-amber-500">*</span>
                </label>
                <CustomSelect
                  value={selectedBorrowerId}
                  onChange={(val) => setSelectedBorrowerId(val)}
                  placeholder="-- Choose Member / University ID --"
                  options={activeBorrowers.map(b => ({
                    value: b.id,
                    label: b.name,
                    sublabel: `${b.university_id || b.student_id} · ${b.department}`,
                    badge: b.role || 'Member'
                  }))}
                  searchable
                />
              </div>

              {/* Loan Period */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Loan Period Duration
                </label>
                <CustomSelect
                  value={loanPeriodDays}
                  onChange={(val) => setLoanPeriodDays(Number(val))}
                  options={[
                    { value: 7, label: '7 Days (Course Reserve)' },
                    { value: 14, label: '14 Days (Standard Undergraduate Loan)' },
                    { value: 30, label: '30 Days (Faculty / Research Loan)' },
                    { value: 60, label: '60 Days (Semester Extended Grant)' }
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsIssuing(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issueButtonState !== 'idle'}
                className="min-w-[155px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-md tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {issueButtonState === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : issueButtonState === 'success' ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-950 font-bold animate-in zoom-in-75 duration-200">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Issued</span>
                  </span>
                ) : (
                  <span>Commit Loan Issue</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, book title, or barcode..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 search-input-expand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-icon absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#020617] p-1 rounded-lg border border-slate-200 dark:border-[#334155]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'ALL' 
                  ? 'bg-slate-800 text-[#F1F5F9] shadow-2xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Loans ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'ACTIVE' 
                  ? 'bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Active ({activeLoansCount})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'OVERDUE' 
                  ? 'bg-slate-800 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold' 
                  : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('RETURNED')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === 'RETURNED' 
                  ? 'bg-slate-800 text-[#F1F5F9] shadow-2xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Returned
            </button>
          </div>

          {/* Grid View / List View Segmented Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-[#1E293B] text-[#F1F5F9] shadow-xs border border-slate-200/80 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Switch to Card Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-[#1E293B] text-[#F1F5F9] shadow-xs border border-slate-200/80 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Switch to Table List View"
              aria-label="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Transactions Display: Grid View or Table View */}
        {filteredTxs.length === 0 ? (
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-2xs">
            <ArrowRightLeft className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">No circulation records found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No active or past loans match your current search and status filter.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Reset Circulation Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View of Transaction Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTxs.map((tx) => {
              const isOverdue = tx.status === 'OVERDUE' || (tx.status === 'ACTIVE' && tx.due_date < todayStr);
              const isReturned = tx.status === 'RETURNED';

              return (
                <div
                  key={tx.id}
                  className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 rounded-xl overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between group transition-all duration-200"
                >
                  <div className="p-4 space-y-3">
                    {/* Header: Transaction ID + Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-code text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {tx.id}
                      </span>
                      {isReturned ? (
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          Returned
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>OVERDUE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>Active Loan</span>
                        </span>
                      )}
                    </div>

                    {/* Book Information */}
                    <div>
                      <h4
                        onClick={() => onOpenBookDetails(tx.book_id)}
                        className="font-header text-sm font-bold text-[#F1F5F9] hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
                        title={tx.book_name}
                      >
                        {tx.book_name || 'Book title'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono-code text-slate-500 dark:text-slate-400 mt-1">
                        <BarcodeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tx.barcode}</span>
                      </div>
                    </div>

                    {/* Borrower Information */}
                    <div className="bg-slate-50 dark:bg-[#020617] rounded-lg p-2.5 border border-slate-200/80 dark:border-[#1E293B] space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => onOpenBorrowerDetails(tx.borrower_id)}
                          className="font-semibold text-xs text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors truncate text-left"
                        >
                          {tx.borrower_name || 'Borrower'}
                        </button>
                        <span className="font-mono-code text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
                          {tx.student_id}
                        </span>
                      </div>
                    </div>

                    {/* Dates Display */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-mono-code text-slate-400 block">Issued</span>
                        <span className="font-mono-code text-slate-700 dark:text-slate-300 text-[11px]">{tx.issue_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono-code text-slate-400 block">Due Date</span>
                        <span className={`font-mono-code text-[11px] font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {tx.due_date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#020617]/70 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-2">
                    {!isReturned ? (
                      <button
                        onClick={() => handleReturnAction(tx.id)}
                        disabled={!!returningTxState[tx.id]}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {returningTxState[tx.id] === 'loading' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Returning...</span>
                          </>
                        ) : returningTxState[tx.id] === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold animate-in zoom-in-75 duration-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return Copy</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="w-full text-center text-xs font-mono-code text-slate-400 py-1">
                        Archived · Returned on {tx.return_date}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
        <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#020617] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10.5px] border-b border-slate-200 dark:border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tx ID</th>
                  <th className="py-3 px-4 font-semibold">Title & Barcode</th>
                  <th className="py-3 px-4 font-semibold">Borrower & Member ID</th>
                  <th className="py-3 px-4 font-semibold">Issue Date</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      No circulation records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((tx) => {
                    const isOverdue = tx.status === 'OVERDUE' || (tx.status === 'ACTIVE' && tx.due_date < todayStr);
                    const isReturned = tx.status === 'RETURNED';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 font-medium">
                          {tx.id}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onOpenBookDetails(tx.book_id)}
                            className="font-semibold text-[#F1F5F9] hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left flex items-center gap-1.5 max-w-sm truncate"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{tx.book_name || 'Book record'}</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            <BarcodeIcon className="w-3 h-3 text-slate-400" />
                            <span>{tx.barcode}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onOpenBorrowerDetails(tx.borrower_id)}
                            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left flex items-center gap-1.5 truncate"
                          >
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{tx.borrower_name || 'Borrower'}</span>
                          </button>
                          <p className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {tx.student_id}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {tx.issue_date}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                            {tx.due_date}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isReturned ? (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Returned ({tx.return_date})
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>OVERDUE</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>ON SCHEDULE</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isReturned ? (
                            <button
                              onClick={() => handleReturnAction(tx.id)}
                              disabled={!!returningTxState[tx.id]}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Process book return and restore copy to shelf"
                            >
                              {returningTxState[tx.id] === 'loading' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Returning...</span>
                                </>
                              ) : returningTxState[tx.id] === 'success' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-in zoom-in-75 duration-200">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Returned</span>
                                </span>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Return Copy</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">Archived</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};
export default CirculationDeskView;
