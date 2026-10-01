import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  UserCheck, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Borrower, BorrowerRole, BorrowerStatus } from '../../types/library';

interface AddEditBorrowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (borrowerData: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => { success: boolean; message: string; borrower?: Borrower; existingBorrowerId?: string };
  onUpdate?: (id: string, updates: Partial<Borrower>) => { success: boolean; message: string; borrower?: Borrower };
  borrowerToEdit?: Borrower | null;
  allBorrowers: Borrower[];
  onOpenExisting?: (borrowerId: string) => void;
}

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Law',
  'Education',
  'Physics',
  'Mathematics',
  'Chemistry',
  'English',
  'Islamic Studies',
  'Management Sciences',
  'Civil Engineering'
];

const FACULTY_STAFF_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Visiting Faculty',
  'Librarian',
  'Assistant Librarian',
  'Lab Engineer',
  'Clerk',
  'Senior Clerk',
  'Other'
];

const DRAFT_STORAGE_KEY = 'ulm_borrower_form_draft_v2';
const LAST_SAVED_VALUES_KEY = 'ulm_borrower_last_saved_fields_v1';

export const AddEditBorrowerModal: React.FC<AddEditBorrowerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  borrowerToEdit,
  allBorrowers,
  onOpenExisting,
}) => {
  const isEditMode = Boolean(borrowerToEdit);

  // Form Fields
  const [role, setRole] = useState<BorrowerRole>('Student');
  const [universityId, setUniversityId] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [customDept, setCustomDept] = useState('');
  const [isAddingNewDept, setIsAddingNewDept] = useState(false);
  const [program, setProgram] = useState('BCS');
  const [session, setSession] = useState('FA23');
  const [semester, setSemester] = useState<number>(1);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [borrowLimit, setBorrowLimit] = useState(3);
  const [status, setStatus] = useState<BorrowerStatus>('active');
  const [notes, setNotes] = useState('');

  // UI & Validation States
  const [idPatternWarning, setIdPatternWarning] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<{ message: string; existingId?: string; existingName?: string } | null>(null);
  const [samePersonWarning, setSamePersonWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Last entered values (for "Save & Next" & "Same as above")
  const [lastSaved, setLastSaved] = useState<Record<string, any>>(() => {
    try {
      const data = localStorage.getItem(LAST_SAVED_VALUES_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Load draft or populate for edit
  useEffect(() => {
    if (!isOpen) return;

    if (borrowerToEdit) {
      setRole(borrowerToEdit.role || 'Student');
      setUniversityId(borrowerToEdit.university_id || borrowerToEdit.student_id || '');
      setName(borrowerToEdit.name || '');
      setFatherName(borrowerToEdit.father_name || '');
      setDepartment(borrowerToEdit.department || 'Computer Science');
      setProgram(borrowerToEdit.program || '');
      setSession(borrowerToEdit.session || '');
      setSemester(borrowerToEdit.semester || 1);
      setDesignation(borrowerToEdit.designation || 'Assistant Professor');
      setPhone(borrowerToEdit.phone || '');
      setEmail(borrowerToEdit.email || '');
      setAddress(borrowerToEdit.address || '');
      setPhotoUrl(borrowerToEdit.photo_url || borrowerToEdit.photo_path || '');
      setJoinedDate(borrowerToEdit.joined_date || new Date().toISOString().split('T')[0]);
      setValidUntil(borrowerToEdit.valid_until || '');
      setBorrowLimit(borrowerToEdit.borrow_limit || (borrowerToEdit.role === 'Faculty' ? 10 : borrowerToEdit.role === 'Staff' ? 5 : 3));
      setStatus(borrowerToEdit.status || 'active');
      setNotes(borrowerToEdit.notes || '');
      setDuplicateError(null);
      setSamePersonWarning(null);
      setFormError(null);
    } else {
      // Check saved draft
      try {
        const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setRole(draft.role || 'Student');
          setUniversityId(draft.universityId || '');
          setName(draft.name || '');
          setFatherName(draft.fatherName || '');
          setDepartment(draft.department || 'Computer Science');
          setProgram(draft.program || 'BCS');
          setSession(draft.session || 'FA23');
          setSemester(draft.semester || 1);
          setDesignation(draft.designation || 'Assistant Professor');
          setPhone(draft.phone || '');
          setEmail(draft.email || '');
          setAddress(draft.address || '');
          setPhotoUrl(draft.photoUrl || '');
          setJoinedDate(draft.joinedDate || new Date().toISOString().split('T')[0]);
          setValidUntil(draft.validUntil || '');
          setBorrowLimit(draft.borrowLimit || 3);
          setStatus(draft.status || 'active');
          setNotes(draft.notes || '');
        } else {
          resetNewForm();
        }
      } catch {
        resetNewForm();
      }
    }
  }, [isOpen, borrowerToEdit]);

  const resetNewForm = () => {
    setRole('Student');
    setUniversityId('');
    setName('');
    setFatherName('');
    setDepartment('Computer Science');
    setProgram('BCS');
    setSession('FA23');
    setSemester(1);
    setDesignation('Assistant Professor');
    setPhone('');
    setEmail('');
    setAddress('');
    setPhotoUrl('');
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setValidUntil('');
    setBorrowLimit(3);
    setStatus('active');
    setNotes('');
    setDuplicateError(null);
    setSamePersonWarning(null);
    setFormError(null);
  };

  // Save draft on change when adding new
  useEffect(() => {
    if (!isOpen || isEditMode) return;
    const draft = {
      role,
      universityId,
      name,
      fatherName,
      department,
      program,
      session,
      semester,
      designation,
      phone,
      email,
      address,
      photoUrl,
      joinedDate,
      validUntil,
      borrowLimit,
      status,
      notes,
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [isOpen, isEditMode, role, universityId, name, fatherName, department, program, session, semester, designation, phone, email, address, photoUrl, joinedDate, validUntil, borrowLimit, status, notes]);

  // Adjust default limit when role changes (if user hasn't explicitly customized)
  const handleRoleChange = (newRole: BorrowerRole) => {
    setRole(newRole);
    if (!isEditMode) {
      if (newRole === 'Faculty') setBorrowLimit(10);
      else if (newRole === 'Staff') setBorrowLimit(5);
      else setBorrowLimit(3);
    }
  };

  // Auto-fill Session and Program from University ID: ^ULM-([A-Z]{2}\d{2})-([A-Z]+)-(\d{3})$
  const handleUniversityIdChange = (raw: string) => {
    setUniversityId(raw);
    setDuplicateError(null);

    const trimmed = raw.trim();
    if (!trimmed) {
      setIdPatternWarning(null);
      return;
    }

    const match = trimmed.match(/^ULM-([A-Z]{2}\d{2})-([A-Z]+)-(\d{3})$/i);
    if (match) {
      setIdPatternWarning(null);
      if (role === 'Student') {
        const detectedSession = match[1].toUpperCase();
        const detectedProgram = match[2].toUpperCase();
        setSession(detectedSession);
        setProgram(detectedProgram);
      }
    } else {
      // Non-blocking warning only
      setIdPatternWarning('Format note: Standard student ID follows pattern ULM-FA23-BCS-042 (Faculty & Staff IDs may vary).');
    }

    // Live duplicate check
    const existing = allBorrowers.find(
      b => (b.university_id || b.student_id).trim().toUpperCase() === trimmed.toUpperCase() && 
           b.status !== 'left' &&
           (!borrowerToEdit || b.id !== borrowerToEdit.id)
    );
    if (existing) {
      setDuplicateError({
        message: `Already exists: ${existing.name}`,
        existingId: existing.id,
        existingName: existing.name
      });
    }
  };

  // Name & Phone similarity warning
  useEffect(() => {
    if (!name.trim() || !phone.trim()) {
      setSamePersonWarning(null);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 7) {
      const match = allBorrowers.find(
        b => b.name.toLowerCase().trim() === name.toLowerCase().trim() &&
             b.phone.replace(/\D/g, '') === cleanPhone &&
             (!borrowerToEdit || b.id !== borrowerToEdit.id)
      );
      if (match) {
        setSamePersonWarning(`Notice: A borrower with the name "${match.name}" and phone "${match.phone}" is already in the database (${match.university_id}).`);
      } else {
        setSamePersonWarning(null);
      }
    } else {
      setSamePersonWarning(null);
    }
  }, [name, phone, allBorrowers, borrowerToEdit]);

  // Photo Upload & Canvas Resizing to 300 px
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // High-fidelity resize to 300x300 px square crop
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.9));
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

  // "Same as above" helper: copies value from last saved entry
  const applySameAsAbove = (field: string) => {
    if (field in lastSaved && lastSaved[field] !== undefined) {
      const val = lastSaved[field];
      if (field === 'role') handleRoleChange(val);
      else if (field === 'department') setDepartment(val);
      else if (field === 'program') setProgram(val);
      else if (field === 'session') setSession(val);
      else if (field === 'semester') setSemester(val);
      else if (field === 'validUntil') setValidUntil(val);
      else if (field === 'borrowLimit') setBorrowLimit(val);
      else if (field === 'designation') setDesignation(val);
      else if (field === 'address') setAddress(val);
    }
  };

  // Pakistani phone normalizer
  const normalizePakistaniPhone = (raw: string): string => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length >= 12) {
      digits = '0' + digits.substring(2);
    }
    if (digits.length === 11 && digits.startsWith('03')) {
      return `${digits.substring(0, 4)}-${digits.substring(4)}`;
    }
    return raw.trim();
  };

  // Collect & Validate
  const handleSave = (isSaveAndNext: boolean = false) => {
    setFormError(null);

    if (!universityId.trim()) {
      setFormError('University ID is required.');
      return;
    }
    if (!name.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!department.trim()) {
      setFormError('Department is required.');
      return;
    }

    // Phone validation
    const normPhone = normalizePakistaniPhone(phone);
    if (phone.trim() && !/^(\+92\s?3\d{2}|03\d{2})[- ]?\d{7}$/.test(phone.trim())) {
      setFormError('Please enter a valid Pakistani phone number format (03XX-XXXXXXX or +92 3XX XXXXXXX).');
      return;
    }

    // Email validation
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid university email address.');
      return;
    }

    // Check duplicate ID again
    const dup = allBorrowers.find(
      b => (b.university_id || b.student_id).trim().toUpperCase() === universityId.trim().toUpperCase() &&
           b.status !== 'left' &&
           (!borrowerToEdit || b.id !== borrowerToEdit.id)
    );
    if (dup) {
      setDuplicateError({
        message: `Already exists: ${dup.name}`,
        existingId: dup.id,
        existingName: dup.name
      });
      return;
    }

    const borrowerPayload = {
      role,
      university_id: universityId.trim().toUpperCase(),
      barcode: universityId.trim().toUpperCase(),
      name: name.trim(),
      father_name: role === 'Student' ? fatherName.trim() : undefined,
      department: department.trim(),
      program: role === 'Student' ? program.trim() : (role === 'Faculty' ? 'Faculty' : 'Staff'),
      session: role === 'Student' ? session.trim().toUpperCase() : undefined,
      semester: role === 'Student' ? semester : null,
      designation: role !== 'Student' ? designation.trim() : undefined,
      phone: normPhone || '0300-0000000',
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      photo_url: photoUrl || undefined,
      photo_path: photoUrl || undefined,
      joined_date: joinedDate || new Date().toISOString().split('T')[0],
      valid_until: validUntil ? validUntil : null,
      borrow_limit: borrowLimit,
      status,
      notes: notes.trim() || undefined,
      student_id: universityId.trim().toUpperCase(),
    };

    if (isEditMode && borrowerToEdit && onUpdate) {
      const res = onUpdate(borrowerToEdit.id, borrowerPayload);
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      onClose();
    } else {
      const res = onSave(borrowerPayload);
      if (!res.success) {
        setFormError(res.message);
        if (res.existingBorrowerId) {
          setDuplicateError({
            message: res.message,
            existingId: res.existingBorrowerId
          });
        }
        return;
      }

      // Save fields to memory for "Save & Next" and "Same as above"
      const remembered = {
        role,
        department,
        program,
        session,
        semester,
        validUntil,
        borrowLimit,
        designation,
        address,
      };
      setLastSaved(remembered);
      try {
        localStorage.setItem(LAST_SAVED_VALUES_KEY, JSON.stringify(remembered));
      } catch {
        // ignore
      }

      if (isSaveAndNext) {
        // Clear personal identifiers, retain class/session/department context
        setUniversityId('');
        setName('');
        setFatherName('');
        setPhone('');
        setEmail('');
        setPhotoUrl('');
        setNotes('');
        setDuplicateError(null);
        setSamePersonWarning(null);
        setFormError(null);
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
      } else {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {
          // ignore
        }
        onClose();
      }
    }
  };

  // Keyboard navigation: Enter = "Save & Next" when adding
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (isEditMode) {
        handleSave(false);
      } else {
        handleSave(true);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="borrower-dialog-title"
    >
      {/* Exact 640px wide modal, dark theme: Card #0B1220 on Canvas #020617, 1px #334155 border, 12px radius, 24px padding */}
      <div 
        className="w-full max-w-[640px] bg-[#0B1220] border border-[#334155] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all text-slate-200"
        style={{ width: '640px' }}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#020617] border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 id="borrower-dialog-title" className="text-base font-bold text-white font-cinzel leading-tight tracking-wide">
                {isEditMode ? 'Edit Library Borrower Profile' : 'Enroll Borrower (Add Person)'}
              </h2>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Institutional Member Registration &amp; Circulation Privileges
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body (24px padding = p-6) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Duplicate University ID Blocking Banner */}
          {duplicateError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold">{duplicateError.message}</span>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    University ID must be strictly unique in the institutional database.
                  </p>
                </div>
              </div>
              {duplicateError.existingId && onOpenExisting && (
                <button
                  type="button"
                  onClick={() => onOpenExisting(duplicateError.existingId!)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  <span>Open Record</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Same Person Warning (Name + Phone) */}
          {samePersonWarning && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{samePersonWarning}</span>
            </div>
          )}

          {/* Top Segmented Selector: [Student | Faculty | Staff] */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              People Type / Institutional Role <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#020617] p-1.5 rounded-xl border border-[#334155]">
              {(['Student', 'Faculty', 'Staff'] as BorrowerRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    role === r
                      ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. University ID & Full Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 tracking-wide">
                  University ID <span className="text-amber-500">*</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">Unique Code</span>
              </div>
              <input
                type="text"
                required
                value={universityId}
                onChange={(e) => handleUniversityIdChange(e.target.value)}
                placeholder="e.g. ULM-FA23-BCS-042"
                className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
              />
              {idPatternWarning && (
                <p className="text-[10px] text-amber-400/90 mt-1 leading-tight font-sans">
                  {idPatternWarning}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 tracking-wide">
                  Full Name <span className="text-amber-500">*</span>
                </label>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Muhammad Asad Khan"
                className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* Student Specific Fields: Father Name, Session, Program, Semester */}
          {role === 'Student' && (
            <div className="p-4 rounded-xl bg-[#020617] border border-amber-500/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Student Academic Profile
                </span>
                <button
                  type="button"
                  onClick={() => {
                    applySameAsAbove('program');
                    applySameAsAbove('session');
                    applySameAsAbove('semester');
                  }}
                  className="text-[10.5px] font-mono text-amber-400/90 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Same as previous student
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">Father Name</label>
                  </div>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Gulzar Ahmad"
                    className="w-full bg-[#0B1220] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">Degree Program (e.g. BCS)</label>
                    <button
                      type="button"
                      onClick={() => applySameAsAbove('program')}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Same
                    </button>
                  </div>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. BCS, BS Physics, LLB"
                    className="w-full bg-[#0B1220] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">Academic Session (e.g. FA23)</label>
                    <button
                      type="button"
                      onClick={() => applySameAsAbove('session')}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Same
                    </button>
                  </div>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="e.g. FA23, SP24"
                    className="w-full bg-[#0B1220] border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">Current Semester (1-8)</label>
                    <button
                      type="button"
                      onClick={() => applySameAsAbove('semester')}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Same
                    </button>
                  </div>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full bg-[#0B1220] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Faculty / Staff Specific Fields: Designation */}
          {role !== 'Student' && (
            <div className="p-4 rounded-xl bg-[#020617] border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  {role} Designation &amp; Appointment
                </span>
                <button
                  type="button"
                  onClick={() => applySameAsAbove('designation')}
                  className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                >
                  Same as above
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Designation Rank
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {FACULTY_STAFF_DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 2. Department Dropdown with Autocomplete & "Add New" */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 tracking-wide">
                Department <span className="text-amber-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applySameAsAbove('department')}
                  className="text-[10.5px] font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  Same as above
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewDept(!isAddingNewDept)}
                  className="text-[10.5px] text-sky-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingNewDept ? 'Select Existing' : 'Add New Dept'}</span>
                </button>
              </div>
            </div>

            {isAddingNewDept ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => {
                    setCustomDept(e.target.value);
                    setDepartment(e.target.value);
                  }}
                  placeholder="Type new department name..."
                  className="flex-1 bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDept.trim()) {
                      setDepartment(customDept.trim());
                      setIsAddingNewDept(false);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            ) : (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {DEFAULT_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                {customDept && !DEFAULT_DEPARTMENTS.includes(customDept) && (
                  <option value={customDept}>{customDept}</option>
                )}
              </select>
            )}
          </div>

          {/* 3. Phone & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 tracking-wide">
                  Mobile Phone (Pakistani)
                </label>
                <span className="text-[10px] font-mono text-slate-400">03XX-XXXXXXX</span>
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567 or +92 300..."
                className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 tracking-wide">
                  University Email (Optional)
                </label>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@ulm.edu.pk"
                className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
              />
            </div>
          </div>

          {/* 4. Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 tracking-wide">
                Campus / Residential Address
              </label>
              <button
                type="button"
                onClick={() => applySameAsAbove('address')}
                className="text-[10.5px] font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Same as above
              </button>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Hostels / Lakki Marwat Campus Address"
              className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
            />
          </div>

          {/* 5. Photo Row (Browse..., copied/resized to 300 px) */}
          <div className="p-3.5 rounded-xl bg-[#020617] border border-[#334155] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[10px] font-mono text-slate-500 text-center p-1">
                    No Photo (300px)
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Member Photo (Resized to 300 px)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Saved into data folder under Photos/ for member card printing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="borrower-modal-photo-input"
              />
              <label
                htmlFor="borrower-modal-photo-input"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#334155] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500" />
                <span>{photoUrl ? 'Replace...' : 'Browse...'}</span>
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 6. Joined Date, Valid Until, Limit, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Joined Date
              </label>
              <input
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
                className="w-full bg-[#020617] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Valid Until</label>
                <button
                  type="button"
                  onClick={() => applySameAsAbove('validUntil')}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Same
                </button>
              </div>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-[#020617] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Borrow Limit</label>
                <button
                  type="button"
                  onClick={() => applySameAsAbove('borrowLimit')}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Same
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={borrowLimit}
                onChange={(e) => setBorrowLimit(Number(e.target.value))}
                className="w-full bg-[#020617] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BorrowerStatus)}
                className="w-full bg-[#020617] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide">
              Institutional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by HOD, special library clearance, or remarks..."
              className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#020617] border-t border-[#334155] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-slate-500">
            {isEditMode ? 'Editing Borrower Profile' : 'Tip: Press [Enter] for rapid "Save & Next"'}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isEditMode && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={Boolean(duplicateError)}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Save this record and keep role, department and class context ready for the next person"
              >
                <span>Save &amp; Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={Boolean(duplicateError)}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode ? 'Save Changes' : 'Save & Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddEditBorrowerModal;
