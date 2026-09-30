import React, { useEffect } from 'react';
import { 
  X, 
  User, 
  GraduationCap, 
  Phone, 
  Mail, 
  BookOpen, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Barcode as BarcodeIcon,
  Trash2
} from 'lucide-react';
import { Borrower, Transaction } from '../../types/library';

interface BorrowerDetailsModalProps {
  borrower: Borrower | null;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onReturnLoan: (transactionId: string) => void;
  onOpenBookDetails: (bookId: string) => void;
  onDeleteBorrower?: (borrower: Borrower) => void;
}

export const BorrowerDetailsModal: React.FC<BorrowerDetailsModalProps> = ({
  borrower,
  transactions,
  isOpen,
  onClose,
  onReturnLoan,
  onOpenBookDetails,
  onDeleteBorrower,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !borrower) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const borrowerTxs = transactions.filter(t => t.borrower_id === borrower.id);
  const activeLoans = borrowerTxs.filter(t => t.status !== 'RETURNED');
  const pastLoans = borrowerTxs.filter(t => t.status === 'RETURNED');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#020617] border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>CAMPUS BORROWER PROFILE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close borrower profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Member Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] flex items-center gap-4">
            {borrower.photo_url ? (
              <img
                src={borrower.photo_url}
                alt={borrower.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/40 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-cinzel font-bold text-xl shrink-0">
                {borrower.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{borrower.name}</h3>
              <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">{borrower.student_id}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{borrower.department}</span>
                </span>
                <span>•</span>
                <span>{borrower.program}</span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Phone Contact</span>
              </span>
              <p className="font-mono text-slate-800 dark:text-slate-200 font-medium">{borrower.phone}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Campus Email</span>
              </span>
              <p className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate">{borrower.email}</p>
            </div>
          </div>

          {/* Active Loans */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Active Book Loans ({activeLoans.length})</span>
            </h4>

            {activeLoans.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#020617] p-3.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
                No books currently checked out. Borrower account in good standing with full circulation privileges.
              </p>
            ) : (
              <div className="space-y-2">
                {activeLoans.map(loan => {
                  const isOverdue = loan.status === 'OVERDUE' || loan.due_date < todayStr;
                  return (
                    <div 
                      key={loan.id} 
                      className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => onOpenBookDetails(loan.book_id)}
                          className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-left block truncate transition-colors"
                        >
                          {loan.book_name}
                        </button>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <BarcodeIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{loan.barcode}</span>
                          <span>·</span>
                          <span>Issued {loan.issue_date}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-medium">Due Date</span>
                          <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {loan.due_date}
                          </span>
                        </div>

                        <button
                          onClick={() => onReturnLoan(loan.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Returned Loans */}
          {pastLoans.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Borrowing History ({pastLoans.length})
              </h4>
              <div className="space-y-1.5">
                {pastLoans.map(loan => (
                  <div key={loan.id} className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-[#020617]/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="truncate">{loan.book_name}</span>
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">
                      Returned {loan.return_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          {onDeleteBorrower ? (
            <button
              onClick={() => {
                onDeleteBorrower(borrower);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Student Record</span>
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default BorrowerDetailsModal;
