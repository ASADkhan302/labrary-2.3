import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  AlertCircle,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Building2,
  Trash2,
  Edit3,
  Printer,
  PlusCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { Borrower, Transaction, BorrowerRole, BorrowerStatus } from '../types/library';
import AddEditBorrowerModal from './modals/AddEditBorrowerModal';
import BorrowerDetailsModal from './modals/BorrowerDetailsModal';
import MemberCardPrintModal from './modals/MemberCardPrintModal';
import BorrowerCsvImportModal from './modals/BorrowerCsvImportModal';

interface BorrowersViewProps {
  borrowers: Borrower[];
  transactions: Transaction[];
  onAddBorrower: (borrower: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => { success: boolean; message: string; borrower?: Borrower; existingBorrowerId?: string };
  onUpdateBorrower?: (id: string, updates: Partial<Borrower>) => { success: boolean; message: string; borrower?: Borrower };
  onDeleteBorrower?: (borrower: Borrower) => void;
  onOpenCirculationForBorrower?: (borrowerId: string) => void;
  onReturnLoan?: (transactionId: string) => void;
  onOpenBookDetails?: (bookId: string) => void;
  onBatchImportBorrowers?: (borrowers: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>[]) => { success: boolean; imported: number; errors: string[] };
  onReloadData?: () => void;
}

export const BorrowersView: React.FC<BorrowersViewProps> = ({
  borrowers,
  transactions,
  onAddBorrower,
  onUpdateBorrower,
  onDeleteBorrower,
  onOpenCirculationForBorrower,
  onReturnLoan,
  onOpenBookDetails,
  onBatchImportBorrowers,
  onReloadData,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | BorrowerRole>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | BorrowerStatus>('All');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null);

  const [detailsBorrower, setDetailsBorrower] = useState<Borrower | null>(null);
  const [cardBorrower, setCardBorrower] = useState<Borrower | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    borrowers.forEach(b => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set).sort();
  }, [borrowers]);

  // Compute active & overdue loans per borrower
  const borrowerStats = useMemo(() => {
    const map = new Map<string, { active: number; overdue: number }>();
    borrowers.forEach(b => map.set(b.id, { active: 0, overdue: 0 }));

    transactions.forEach(t => {
      if (t.status !== 'RETURNED') {
        const stats = map.get(t.borrower_id) || { active: 0, overdue: 0 };
        stats.active += 1;
        if (t.status === 'OVERDUE' || t.due_date < todayStr) {
          stats.overdue += 1;
        }
        map.set(t.borrower_id, stats);
      }
    });

    return map;
  }, [borrowers, transactions, todayStr]);

  // Filtered list
  const filteredBorrowers = useMemo(() => {
    return borrowers.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const uid = (b.university_id || b.student_id || '').toLowerCase();
      const matchesQuery = !q ||
        b.name.toLowerCase().includes(q) ||
        uid.includes(q) ||
        (b.phone && b.phone.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.program && b.program.toLowerCase().includes(q));

      const matchesRole = selectedRole === 'All' || b.role === selectedRole;
      const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
      const matchesDept = selectedDept === 'ALL' || b.department === selectedDept;

      return matchesQuery && matchesRole && matchesStatus && matchesDept;
    });
  }, [borrowers, searchQuery, selectedRole, selectedStatus, selectedDept]);

  // Actions
  const handleOpenAddModal = () => {
    setEditingBorrower(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (borrower: Borrower) => {
    setEditingBorrower(borrower);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDetails = (borrowerId: string) => {
    const found = borrowers.find(b => b.id === borrowerId);
    if (found) {
      setDetailsBorrower(found);
    }
  };

  const handlePrintCard = (borrower: Borrower) => {
    setCardBorrower(borrower);
  };

  const handleToggleStatus = (borrower: Borrower) => {
    if (!onUpdateBorrower) return;
    const newStatus: BorrowerStatus = borrower.status === 'active' ? 'suspended' : 'active';
    onUpdateBorrower(borrower.id, { status: newStatus, is_active: newStatus === 'active' });
    if (detailsBorrower && detailsBorrower.id === borrower.id) {
      setDetailsBorrower({ ...detailsBorrower, status: newStatus, is_active: newStatus === 'active' });
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csv = `University_ID,Name,Role,Department,Father_Name,Program,Session,Semester,Designation,Phone,Email,Address,Borrow_Limit,Valid_Until,Status,Notes
ULM-FA23-BCS-050,Shahid Afridi,Student,Computer Science,Fazal Afridi,BCS,FA23,4,,0300-1122334,shahid.cs@ulm.edu.pk,Lakki Marwat,3,2027-06-30,active,Class FA23
ULM-FAC-PHY-011,Dr. Rehmat Ullah,Faculty,Physics,,,,,Assistant Professor,0345-2233445,rehmat.phy@ulm.edu.pk,Bannu Road Campus,10,,active,Faculty
ULM-STF-ADM-004,Muhammad Irfan,Staff,Management Sciences,,,,,Senior Clerk,0312-5566778,irfan.adm@ulm.edu.pk,Admin Block ULM,5,,active,Admin staff`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ULM_Borrowers_Class_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-5">

        {/* Top Header & Fast Entry Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-cinzel leading-tight">
                University Borrowers Directory
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered students, researchers, and campus faculty members with active library circulation privileges.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Download official whole-class student and faculty CSV template"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>CSV Template</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Bulk import entire class roster from CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Import Class CSV...</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Person</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar (Role, Department, Status) & Search */}
        <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, University ID, phone, email, or program..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-2.5 py-1">
              <span className="text-[10.5px] font-mono text-slate-400 font-semibold uppercase">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-2.5 py-1">
              <span className="text-[10.5px] font-mono text-slate-400 font-semibold uppercase">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-2.5 py-1">
              <span className="text-[10.5px] font-mono text-slate-400 font-semibold uppercase">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="left">Left</option>
              </select>
            </div>

            {/* View Mode Toggle: Table / Grid */}
            <div className="flex items-center bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to Directory Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

          </div>
        </div>

        {/* Directory Listing */}
        {filteredBorrowers.length === 0 ? (
          <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-2xs">
            <Users className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200 font-cinzel">No matching members found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No registered members match your search criteria. Try clearing search keywords or department/status filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); setSelectedRole('All'); setSelectedStatus('All'); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#020617] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10.5px] border-b border-slate-200 dark:border-[#334155]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">University ID</th>
                    <th className="py-3 px-4 font-semibold">Member Name</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Program / Title</th>
                    <th className="py-3 px-4 font-semibold">Phone / Contact</th>
                    <th className="py-3 px-4 text-center font-semibold">Status</th>
                    <th className="py-3 px-4 text-center font-semibold">Loans / Quota</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {filteredBorrowers.map((bor) => {
                    const stats = borrowerStats.get(bor.id) || { active: 0, overdue: 0 };
                    const uid = bor.university_id || bor.student_id;
                    const limit = bor.borrow_limit || (bor.role === 'Faculty' ? 10 : bor.role === 'Staff' ? 5 : 3);

                    return (
                      <tr 
                        key={bor.id} 
                        className="hover:bg-slate-50 dark:hover:bg-[#020617]/50 transition-colors group"
                      >
                        {/* University ID */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {uid}
                        </td>

                        {/* Name + Photo */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(bor.id)}
                            className="flex items-center gap-2.5 text-left text-slate-900 dark:text-white hover:text-amber-500 font-bold transition-colors cursor-pointer"
                          >
                            {bor.photo_url || bor.photo_path ? (
                              <img
                                src={bor.photo_url || bor.photo_path}
                                alt={bor.name}
                                className="w-7 h-7 rounded-lg object-cover border border-amber-500/30 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-cinzel font-bold text-xs shrink-0">
                                {bor.name.charAt(0)}
                              </div>
                            )}
                            <span className="truncate max-w-[170px]">{bor.name}</span>
                          </button>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            bor.role === 'Faculty'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : bor.role === 'Staff'
                              ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {bor.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200">
                          {bor.department}
                        </td>

                        {/* Program / Title */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {bor.role === 'Student' 
                            ? `${bor.program || 'Student'} ${bor.session ? `(${bor.session})` : ''}` 
                            : (bor.designation || bor.role)}
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {bor.phone}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            bor.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : bor.status === 'suspended'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-slate-700/40 text-slate-400 border-slate-600'
                          }`}>
                            {bor.status}
                          </span>
                        </td>

                        {/* Loans / Limit */}
                        <td className="py-3 px-4 text-center font-mono">
                          {stats.overdue > 0 ? (
                            <span className="text-rose-400 font-bold">
                              {stats.active}/{limit} ({stats.overdue} overdue)
                            </span>
                          ) : (
                            <span className={stats.active > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              {stats.active} / {limit}
                            </span>
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(bor.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="View Profile Details & Loans"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(bor)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-amber-500 dark:text-amber-400 transition-colors cursor-pointer"
                              title="Edit Borrower Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {onOpenCirculationForBorrower && (
                              <button
                                type="button"
                                onClick={() => onOpenCirculationForBorrower(bor.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-blue-500 dark:text-blue-400 transition-colors cursor-pointer"
                                title="Issue Book to this Member"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handlePrintCard(bor)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-purple-500 dark:text-purple-400 transition-colors cursor-pointer"
                              title="Print CR80 Member Identification Card"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(bor)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                              title={bor.status === 'active' ? 'Suspend Member Account' : 'Reactivate Member Account'}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>

                            {onDeleteBorrower && (
                              <button
                                type="button"
                                onClick={() => onDeleteBorrower(bor)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                title="Deactivate or Remove Borrower"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View of Member Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBorrowers.map((bor) => {
              const stats = borrowerStats.get(bor.id) || { active: 0, overdue: 0 };
              const uid = bor.university_id || bor.student_id;
              const limit = bor.borrow_limit || (bor.role === 'Faculty' ? 10 : bor.role === 'Staff' ? 5 : 3);

              return (
                <div
                  key={bor.id}
                  className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-[#334155] hover:border-amber-500/50 rounded-xl overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between transition-all"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {bor.photo_url || bor.photo_path ? (
                          <img
                            src={bor.photo_url || bor.photo_path}
                            alt={bor.name}
                            className="w-10 h-10 rounded-lg object-cover border border-amber-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-cinzel font-bold text-sm shrink-0">
                            {bor.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 
                            onClick={() => handleOpenDetails(bor.id)}
                            className="font-header text-sm font-bold text-slate-900 dark:text-white hover:text-amber-500 cursor-pointer truncate transition-colors"
                            title={bor.name}
                          >
                            {bor.name}
                          </h4>
                          <span className="font-mono text-[11px] text-amber-500 font-semibold tracking-wide">
                            {uid}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                        bor.role === 'Faculty'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : bor.role === 'Staff'
                          ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {bor.role}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{bor.department}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pl-5 truncate">
                        {bor.role === 'Student' 
                          ? `${bor.program || 'Student'} (${bor.session || 'Class'})` 
                          : (bor.designation || bor.role)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        bor.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {bor.status}
                      </span>

                      <span className="font-mono text-[11px] text-slate-400">
                        {stats.active} / {limit} books
                      </span>
                    </div>
                  </div>

                  {/* Card Action Strip */}
                  <div className="px-3 py-2 bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-[#334155] flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(bor.id)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#334155] transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(bor)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-[#1E293B] text-amber-500 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#334155] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintCard(bor)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-[#1E293B] text-purple-400 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#334155] transition-colors cursor-pointer"
                    >
                      Card
                    </button>
                    {onDeleteBorrower && (
                      <button
                        type="button"
                        onClick={() => onDeleteBorrower(bor)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 640px ADD/EDIT BORROWER MODAL */}
      <AddEditBorrowerModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={onAddBorrower}
        onUpdate={onUpdateBorrower}
        borrowerToEdit={editingBorrower}
        allBorrowers={borrowers}
        onOpenExisting={(id) => {
          setIsAddEditModalOpen(false);
          handleOpenDetails(id);
        }}
      />

      {/* BORROWER DETAIL MODAL (4 TABS + ACTIONS) */}
      <BorrowerDetailsModal
        isOpen={Boolean(detailsBorrower)}
        borrower={detailsBorrower}
        transactions={transactions}
        onClose={() => setDetailsBorrower(null)}
        onReturnLoan={(txId) => {
          if (onReturnLoan) onReturnLoan(txId);
        }}
        onOpenBookDetails={(bookId) => {
          if (onOpenBookDetails) onOpenBookDetails(bookId);
        }}
        onEditBorrower={(b) => {
          setDetailsBorrower(null);
          handleOpenEditModal(b);
        }}
        onIssueBook={(b) => {
          setDetailsBorrower(null);
          if (onOpenCirculationForBorrower) onOpenCirculationForBorrower(b.id);
        }}
        onPrintCard={(b) => {
          handlePrintCard(b);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* CR80 MEMBER IDENTIFICATION CARD MODAL */}
      <MemberCardPrintModal
        isOpen={Boolean(cardBorrower)}
        borrower={cardBorrower}
        onClose={() => setCardBorrower(null)}
      />

      {/* CLASS ROSTER CSV IMPORT MODAL */}
      <BorrowerCsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportComplete={() => {
          if (onReloadData) onReloadData();
        }}
        onBatchImport={(newBorrowers) => {
          if (onBatchImportBorrowers) {
            return onBatchImportBorrowers(newBorrowers);
          }
          let count = 0;
          const errors: string[] = [];
          newBorrowers.forEach(b => {
            const res = onAddBorrower(b);
            if (res && res.success) count++;
            else if (res && !res.success) errors.push(`${b.university_id}: ${res.message}`);
          });
          return { success: true, imported: count, errors };
        }}
      />

    </div>
  );
};

export default BorrowersView;
