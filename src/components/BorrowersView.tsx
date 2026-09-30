import React, { useState, useMemo, useRef } from 'react';
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
  ShieldCheck,
  Building2,
  Image as ImageIcon,
  Upload,
  Trash2,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Borrower, Transaction } from '../types/library';

interface BorrowersViewProps {
  borrowers: Borrower[];
  transactions: Transaction[];
  onAddBorrower: (borrower: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => { success: boolean; message: string; borrower?: Borrower } | void;
  onOpenBorrowerDetails: (borrowerId: string) => void;
  onDeleteBorrower?: (borrower: Borrower) => void;
}

const PRESET_MEMBER_PHOTOS = [
  { name: 'CS Scholar', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'Engineering', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Researcher', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Faculty', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
];

export const BorrowersView: React.FC<BorrowersViewProps> = ({
  borrowers,
  transactions,
  onAddBorrower,
  onOpenBorrowerDetails,
  onDeleteBorrower,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [program, setProgram] = useState('BS Software Engineering');
  const [className, setClassName] = useState('Semester 7');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Photo upload state
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Gallery file picker change
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) {
        setIsProcessingPhoto(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 400, 400);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.88));
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => setIsProcessingPhoto(false);
      img.src = rawData;
    };
    reader.onerror = () => setIsProcessingPhoto(false);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const departments = useMemo(() => {
    const set = new Set(borrowers.map(b => b.department));
    return Array.from(set);
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

  const filteredBorrowers = useMemo(() => {
    return borrowers
      .filter(b => b.is_active)
      .filter(b => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          b.name.toLowerCase().includes(q) ||
          b.student_id.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q);

        const matchesDept = selectedDept === 'ALL' || b.department === selectedDept;
        return matchesQuery && matchesDept;
      });
  }, [borrowers, searchQuery, selectedDept]);

  const handleCreateBorrower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!studentId.trim()) {
      setErrorMsg('Student / Employee ID is required.');
      return;
    }

    const res = onAddBorrower({
      name: name.trim(),
      student_id: studentId.trim(),
      department,
      program: program.trim() || `${department} Program`,
      class_name: className,
      phone: phone.trim() || '+92 300 0000000',
      email: email.trim() || `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@ulm.edu.pk`,
      photo_url: photoUrl.trim() || undefined,
    });

    // If onAddBorrower returned a rejection (e.g. duplicate ID), display error and keep form open
    if (res && !res.success) {
      setErrorMsg(res.message);
      return;
    }

    setName('');
    setStudentId('');
    setPhone('');
    setEmail('');
    setPhotoUrl('');
    setIsAdding(false);
    setErrorMsg(null);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Campus Borrowers & Faculty Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered students, researchers, and faculty members with circulation privileges.
            </p>
          </div>

          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setErrorMsg(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAdding ? 'Close Drawer' : 'Register New Borrower'}</span>
          </button>
        </div>

        {/* Add Borrower Form Drawer with Photo Upload and Avatar Presets */}
        {isAdding && (
          <form 
            onSubmit={handleCreateBorrower}
            className="bg-white dark:bg-[#020617] border border-amber-500/40 rounded-xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-150"
          >
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold text-sm">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Enroll New Member into Library Database
                  </h3>
                  <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                    Institutional Student & Faculty Registration Desk
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Registration Open
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setErrorMsg(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Enrollment Form"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* MEMBER IDENTIFICATION PORTRAIT STUDIO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0A0F1D]/80 border border-slate-200 dark:border-[#1E293B] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-[#1E293B] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Member Identification Portrait
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload portrait image from device or choose an academic preset
                    </p>
                  </div>
                </div>

                {photoUrl && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Portrait Attached
                  </span>
                )}
              </div>

              {/* Hidden Gallery Input */}
              <input
                id="borrower-gallery-input"
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="sr-only"
                style={{ position: 'fixed', top: 0, left: 0, opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
              />

              {/* Standard Portrait Controls & Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Portrait Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-white dark:bg-slate-900 shadow-md flex items-center justify-center relative">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Borrower Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-2 text-center">
                        <Users className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[10px] font-mono mt-1 text-slate-400">No Photo</span>
                      </div>
                    )}

                    {/* Loading spinner */}
                    {isProcessingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      </div>
                    )}
                  </div>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Actions: Upload & Presets */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Upload Photo Button */}
                    <label
                      htmlFor="borrower-gallery-input"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (galleryInputRef.current) {
                          galleryInputRef.current.value = '';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          galleryInputRef.current?.click();
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer select-none transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Member Photo</span>
                    </label>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Academic Avatar Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
                    </span>
                    {PRESET_MEMBER_PHOTOS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setPhotoUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          photoUrl === preset.url
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Full Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Ullah Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Student / Employee ID <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ULM-2024-CS-088"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                  <option value="English Literature">English Literature</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Degree Program / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. BS Software Engineering"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+92 333 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 tracking-wide">
                  University Email
                </label>
                <input
                  type="email"
                  placeholder="student@ulm.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-md tracking-wide transition-colors cursor-pointer"
              >
                Register Borrower
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-colors">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name, student ID, phone, or email..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Grid View / List View Segmented Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
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
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
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
        </div>

        {/* Borrowers Display: Grid View or Table View */}
        {filteredBorrowers.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-2xs">
            <Users className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">No matching members found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No registered members match your search criteria. Try clearing search keywords or department filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept('ALL'); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Reset Member Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View of Member Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBorrowers.map((bor) => {
              const stats = borrowerStats.get(bor.id) || { active: 0, overdue: 0 };

              return (
                <div
                  key={bor.id}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 rounded-xl overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between group transition-all duration-200"
                >
                  <div className="p-4 space-y-3">
                    {/* Header: Crest Initial + Department Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {bor.photo_url ? (
                          <img
                            src={bor.photo_url}
                            alt={bor.name}
                            className="w-9 h-9 rounded-lg object-cover border border-amber-500/30 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold font-header text-sm shadow-2xs shrink-0">
                            {bor.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 
                            onClick={() => onOpenBorrowerDetails(bor.id)}
                            className="font-header text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors truncate"
                            title={bor.name}
                          >
                            {bor.name}
                          </h4>
                          <span className="font-mono-code text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                            {bor.student_id}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                        {bor.department.split(' ')[0]}
                      </span>
                    </div>

                    {/* Academic Program Info */}
                    <div className="bg-slate-50 dark:bg-[#020617] rounded-lg p-2.5 border border-slate-200/80 dark:border-[#1E293B] space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{bor.program}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono-code pl-5 truncate">
                        {bor.department}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono-code text-[11px] truncate">{bor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{bor.email}</span>
                      </div>
                    </div>

                    {/* Loan Status Indicator */}
                    <div className="pt-1 flex items-center justify-between">
                      {stats.overdue > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>{stats.overdue} Overdue</span>
                        </span>
                      ) : stats.active > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>{stats.active} Active Loan{stats.active > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Good Standing</span>
                        </span>
                      )}

                      <span className="font-mono-code text-[11px] text-slate-400">
                        {stats.active} / 3 books
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#020617]/70 border-t border-slate-200 dark:border-[#1E293B] flex items-center gap-2">
                    <button
                      onClick={() => onOpenBorrowerDetails(bor.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#334155] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Profile & Loans</span>
                    </button>
                    {onDeleteBorrower && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBorrower(bor);
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#1E293B] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#334155] hover:border-rose-200 dark:hover:border-rose-800/60 transition-colors cursor-pointer"
                        title={`Delete student record for ${bor.name}`}
                        aria-label={`Delete student ${bor.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#020617] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10.5px] border-b border-slate-200 dark:border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Member Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID / Roll No</th>
                    <th className="py-3 px-4 font-semibold">Department & Degree</th>
                    <th className="py-3 px-4 font-semibold">Contact Info</th>
                    <th className="py-3 px-4 text-center font-semibold">Active Loans</th>
                    <th className="py-3 px-4 text-center font-semibold">Overdue</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {filteredBorrowers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                        No members match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredBorrowers.map((bor) => {
                      const stats = borrowerStats.get(bor.id) || { active: 0, overdue: 0 };

                      return (
                        <tr key={bor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold">
                            <button
                              onClick={() => onOpenBorrowerDetails(bor.id)}
                              className="text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left flex items-center gap-2"
                            >
                              {bor.photo_url ? (
                                <img
                                  src={bor.photo_url}
                                  alt={bor.name}
                                  className="w-6 h-6 rounded object-cover border border-amber-500/30 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold font-cinzel text-[10px]">
                                  {bor.name.charAt(0)}
                                </div>
                              )}
                              <span>{bor.name}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {bor.student_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{bor.department}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{bor.program}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{bor.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[160px]">{bor.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold">
                            {stats.active > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold">
                                {stats.active} {stats.active === 1 ? 'copy' : 'copies'}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold">
                            {stats.overdue > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {stats.overdue}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => onOpenBorrowerDetails(bor.id)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>Profile & Loans</span>
                              </button>
                              {onDeleteBorrower && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBorrower(bor);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title={`Delete student ${bor.name}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
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
export default BorrowersView;
