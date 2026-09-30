import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Database,
  ArrowDownToLine,
  Laptop,
  HardDrive,
  RefreshCw,
  Sparkles,
  FileCheck,
  Layers,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { Book, Borrower, Transaction, HistoryEntry } from '../types/library';
import { LibraryStorage } from '../services/storage';

interface ExcelCenterProps {
  books: Book[];
  borrowers: Borrower[];
  transactions: Transaction[];
  history: HistoryEntry[];
  onRefreshData: () => void;
}

export const ExcelCenterView: React.FC<ExcelCenterProps> = ({
  books,
  borrowers,
  transactions,
  history,
  onRefreshData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [migrationStats, setMigrationStats] = useState<{ books: number; borrowers: number; transactions: number } | null>(null);
  const [csvText, setCsvText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessMorph, setIsSuccessMorph] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Master PC-to-PC Migration Exports
  const handleExportMasterCsv = () => {
    LibraryStorage.exportMasterMigrationCsv();
    setImportStatus('Generated Master Migration CSV package. Transfer this file to your other PC via USB or network.');
  };

  const handleExportMasterJson = () => {
    LibraryStorage.exportMasterMigrationJson();
    setImportStatus('Generated complete SQLite JSON database clone. Transfer this file to your other PC for instant zero-loss setup.');
  };

  // Dedicated Sheet Exports
  const handleExportBooks = () => {
    const data = books.filter(b => b.is_active).map(b => ({
      Barcode: b.barcode,
      ISBN: b.isbn,
      BookTitle: b.book_name,
      Author: b.author,
      Category: b.category,
      Publisher: b.publisher,
      TotalCopies: b.total_quantity,
      AvailableCopies: b.available_quantity,
      IssuedCopies: b.total_quantity - b.available_quantity,
      Shelf: b.shelf,
      Row: b.row,
      CallNumber: b.dewey_call_number,
    }));
    LibraryStorage.exportCsv(data, `ULM_Books_Catalog_${todayStr}.csv`);
  };

  const handleExportBorrowers = () => {
    const data = borrowers.filter(b => b.is_active).map(b => ({
      StudentID: b.student_id,
      FullName: b.name,
      Department: b.department,
      Program: b.program,
      Phone: b.phone,
      Email: b.email,
    }));
    LibraryStorage.exportCsv(data, `ULM_Borrowers_Register_${todayStr}.csv`);
  };

  const handleExportTransactions = () => {
    const data = transactions.map(t => ({
      TransactionID: t.id,
      Barcode: t.barcode,
      BookTitle: t.book_name,
      BorrowerName: t.borrower_name,
      StudentID: t.student_id,
      Action: t.action,
      IssueDate: t.issue_date,
      DueDate: t.due_date,
      ReturnDate: t.return_date || 'N/A',
      Status: t.status,
    }));
    LibraryStorage.exportCsv(data, `ULM_Circulation_Ledger_${todayStr}.csv`);
  };

  const handleExportHistory = () => {
    const data = history.map(h => ({
      ID: h.id,
      Action: h.action,
      Description: h.description,
      Barcode: h.barcode,
      User: h.user,
      Timestamp: h.created_at,
    }));
    LibraryStorage.exportCsv(data, `ULM_Audit_Log_${todayStr}.csv`);
  };

  // Master Ingestion from uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setImportError('File is empty or could not be read.');
        setIsProcessing(false);
        return;
      }
      setCsvText(content);
      executeMigration(content);
    };
    reader.onerror = () => {
      setImportError('Failed to read migration file.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input so same file can be re-selected
  };

  // Ingestion Execution
  const executeMigration = (rawText: string) => {
    setIsProcessing(true);
    setImportStatus(null);
    setImportError(null);

    try {
      const res = LibraryStorage.importMasterMigrationFile(rawText, importMode);
      if (res.success) {
        setImportStatus(res.message);
        setMigrationStats(res.stats);
        setIsSuccessMorph(true);
        setTimeout(() => setIsSuccessMorph(false), 1200);
        onRefreshData();
      } else {
        setImportError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Migration process failed: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleMigrationFile = () => {
    const sample = `# ====================================================================
# UNIVERSITY OF LAKKI MARWAT - LIBRARY MANAGEMENT SYSTEM (LMS)
# MASTER PC-TO-PC DATA MIGRATION PACKAGE (SAMPLE TEST FILE)
# ====================================================================

# === SECTION: SETTINGS ===
StationID,LibraryName,UniversityName,CampusAddress,Phone,Email,ScannerSound,ErrorSound,WalMode
"LMS-WIN-02","Central Campus Library","University of Lakki Marwat","Lakki Marwat, KPK","+92-969-510015","library@ulm.edu.pk",true,true,true

# === SECTION: BOOKS ===
Barcode,ISBN,BookTitle,Author,Category,TotalCopies,AvailableCopies,Shelf,Row,DeweyCallNumber,Publisher,Edition,Year,Language,IsActive
"9780132350884","978-0132350884","Clean Code: Agile Software Craftsmanship","Robert C. Martin","Computer Science",6,6,"CS-Rack-04","1","005.1 MAR","Prentice Hall","1st Edition",2020,"English",1
"9780262033848","978-0262033848","Introduction to Algorithms","Thomas H. Cormen","Computer Science",8,7,"CS-Rack-05","2","518.1 COR","MIT Press","4th Edition",2022,"English",1
"9780134685991","978-0134685991","Effective Java","Joshua Bloch","Computer Science",5,5,"CS-Rack-06","1","005.133 BLO","Addison-Wesley","3rd Edition",2018,"English",1
"9780199535569","978-0199535569","Principles of Islamic Jurisprudence","Mohammad Hashim Kamali","Islamic Studies",7,6,"IS-Rack-01","1","297.14 KAM","Islamic Texts","3rd Edition",2021,"English",1

# === SECTION: BORROWERS ===
StudentID,FullName,Department,Program,ClassName,Phone,Email,IsActive
"ULM-2023-CS-0101","Muhammad Tariq Khan","Computer Science","BS Computer Science","BS-CS-7A","0345-9876543","tariq.khan@ulm.edu.pk",1
"ULM-2023-ENG-0202","Ayesha Bibi","Electrical Engineering","BS Electrical","BSEE-5B","0333-1234567","ayesha.bibi@ulm.edu.pk",1
"ULM-2022-ISL-0303","Hafiz Bilal Ahmad","Islamic Studies","MPhil Islamic Studies","MPHIL-1","0300-5551234","bilal.ahmad@ulm.edu.pk",1

# === SECTION: TRANSACTIONS ===
TransactionID,Barcode,BookTitle,BorrowerName,StudentID,Action,IssueDate,DueDate,ReturnDate,Quantity,Status
"tx-sample-001","9780262033848","Introduction to Algorithms","Muhammad Tariq Khan","ULM-2023-CS-0101","ISSUE","${todayStr}","2026-10-10","N/A",1,"ACTIVE"`;
    setCsvText(sample);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Excel Center & Cross-PC System Migration</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Easily migrate all library data between computers or export and import spreadsheet audit ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SQLite WAL Engine</span>
            </span>
          </div>
        </div>

        {/* === FEATURE HIGHLIGHT: PC-TO-PC DATA SHIFTING & MIGRATION HUB === */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-[#1E293B] dark:via-[#0F172A] dark:to-[#172554]/30 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                  <Laptop className="w-3 h-3" />
                  <span>PC-to-PC Migration</span>
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Zero-Loss Data Shifting</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-cinzel text-slate-900 dark:text-white tracking-wide">
                Shift All Library Data to Another Computer or Workstation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Need to transfer this library system to a new PC, staff laptop, or another campus workstation? 
                Export the <strong>Master Portable Package</strong> below. When opened on the other PC, this application will automatically access, unpack, and populate all books, barcodes, student accounts, and active circulation loans into that computer's dedicated space.
              </p>
            </div>

            {/* Quick Master Export Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportMasterCsv}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
                title="Download unified master CSV package readable in Excel and auto-importable on any PC"
              >
                <Download className="w-4 h-4 stroke-[2.2]" />
                <span>Export Master Migration Excel/CSV</span>
              </button>

              <button
                onClick={handleExportMasterJson}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Download 100% complete SQLite database clone"
              >
                <Database className="w-4 h-4 text-amber-400 stroke-[2.2]" />
                <span>Export System Database Clone (.JSON)</span>
              </button>
            </div>
          </div>

          {/* 3-Step Migration Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0B1120]/80 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Step 1: Export from this PC
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click <strong>"Export Master Migration Excel/CSV"</strong> above. Save the generated file to a USB flash drive, external disk, or local network share.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0B1120]/80 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold font-mono text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Step 2: Open on New PC
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Launch the Library Management System on the other computer, open this <strong>Excel / CSV Center</strong> tab, and navigate to the Migration Ingestion area.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0B1120]/80 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Step 3: Instant Restoration
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select or paste the Master Migration file. The system will unpack every book, member, and loan into that PC's dedicated database space in seconds.
              </p>
            </div>
          </div>

          {/* Master Ingestion & Restoration Area on this PC */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>Ingest / Restore Master Package on this PC</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your Master Migration file (.csv or .json) from USB or paste its text below.
                </p>
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-2">Mode:</span>
                <button
                  onClick={() => setImportMode('merge')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    importMode === 'merge' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Merge imported records with any existing records on this PC without overwriting unchanged data"
                >
                  Safe Merge
                </button>
                <button
                  onClick={() => setImportMode('overwrite')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    importMode === 'overwrite' 
                      ? 'bg-rose-500 text-white font-bold shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Complete Mirror Clone: Replace local storage on this computer with the exact data from the other PC"
                >
                  Full Clone & Overwrite
                </button>
              </div>
            </div>

            {/* Hidden File Input (active in DOM for reliable OS file picker access) */}
            <input 
              id="master-migration-file-input"
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv,.json,.txt" 
              className="sr-only"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '1px',
                height: '1px',
                opacity: 0,
                pointerEvents: 'none'
              }}
            />

            {/* Drag & Drop Upload Zone */}
            <div 
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    if (text) {
                      setCsvText(text);
                      executeMigration(text);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
              className="border-2 border-dashed border-amber-500/40 hover:border-amber-500/80 bg-white/50 dark:bg-slate-950/40 rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all hover:bg-amber-500/5 group select-none"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <HardDrive className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Click to browse Master Migration file from USB or Computer
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Supports ULM_LMS_Master_Migration_Package_*.csv and ULM_LMS_System_Database_Clone_*.json
              </p>
            </div>

            {/* Status & Confirmation Feedback */}
            {importStatus && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{importStatus}</span>
                </div>
                {migrationStats && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40">
                      <span className="block text-[10px] text-emerald-800 dark:text-emerald-300">Books Loaded</span>
                      <span className="text-base font-bold text-emerald-950 dark:text-white">{migrationStats.books}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40">
                      <span className="block text-[10px] text-emerald-800 dark:text-emerald-300">Members Loaded</span>
                      <span className="text-base font-bold text-emerald-950 dark:text-white">{migrationStats.borrowers}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/40">
                      <span className="block text-[10px] text-emerald-800 dark:text-emerald-300">Loans Restored</span>
                      <span className="text-base font-bold text-emerald-950 dark:text-white">{migrationStats.transactions}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Manual Buffer Editor / Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Direct Migration Data Buffer (Optional text view)
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={loadSampleMigrationFile}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-mono text-[11px] cursor-pointer"
                  >
                    Load Sample Transfer File
                  </button>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <button
                    onClick={() => {
                      loadSampleMigrationFile();
                      const sample = `# ====================================================================
# UNIVERSITY OF LAKKI MARWAT - LIBRARY MANAGEMENT SYSTEM (LMS)
# MASTER PC-TO-PC DATA MIGRATION PACKAGE (SAMPLE TEST FILE)
# ====================================================================

# === SECTION: SETTINGS ===
StationID,LibraryName,UniversityName,CampusAddress,Phone,Email,ScannerSound,ErrorSound,WalMode
"LMS-WIN-02","Central Campus Library","University of Lakki Marwat","Lakki Marwat, KPK","+92-969-510015","library@ulm.edu.pk",true,true,true

# === SECTION: BOOKS ===
Barcode,ISBN,BookTitle,Author,Category,TotalCopies,AvailableCopies,Shelf,Row,DeweyCallNumber,Publisher,Edition,Year,Language,IsActive
"9780132350884","978-0132350884","Clean Code: Agile Software Craftsmanship","Robert C. Martin","Computer Science",6,6,"CS-Rack-04","1","005.1 MAR","Prentice Hall","1st Edition",2020,"English",1
"9780262033848","978-0262033848","Introduction to Algorithms","Thomas H. Cormen","Computer Science",8,7,"CS-Rack-05","2","518.1 COR","MIT Press","4th Edition",2022,"English",1
"9780134685991","978-0134685991","Effective Java","Joshua Bloch","Computer Science",5,5,"CS-Rack-06","1","005.133 BLO","Addison-Wesley","3rd Edition",2018,"English",1
"9780199535569","978-0199535569","Principles of Islamic Jurisprudence","Mohammad Hashim Kamali","Islamic Studies",7,6,"IS-Rack-01","1","297.14 KAM","Islamic Texts","3rd Edition",2021,"English",1

# === SECTION: BORROWERS ===
StudentID,FullName,Department,Program,ClassName,Phone,Email,IsActive
"ULM-2023-CS-0101","Muhammad Tariq Khan","Computer Science","BS Computer Science","BS-CS-7A","0345-9876543","tariq.khan@ulm.edu.pk",1
"ULM-2023-ENG-0202","Ayesha Bibi","Electrical Engineering","BS Electrical","BSEE-5B","0333-1234567","ayesha.bibi@ulm.edu.pk",1
"ULM-2022-ISL-0303","Hafiz Bilal Ahmad","Islamic Studies","MPhil Islamic Studies","MPHIL-1","0300-5551234","bilal.ahmad@ulm.edu.pk",1

# === SECTION: TRANSACTIONS ===
TransactionID,Barcode,BookTitle,BorrowerName,StudentID,Action,IssueDate,DueDate,ReturnDate,Quantity,Status
"tx-sample-001","9780262033848","Introduction to Algorithms","Muhammad Tariq Khan","ULM-2023-CS-0101","ISSUE","${todayStr}","2026-10-10","N/A",1,"ACTIVE"`;
                      executeMigration(sample);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[11px] font-bold cursor-pointer"
                  >
                    ⚡ Test Sample Migration
                  </button>
                </div>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                placeholder="Paste the contents of your Master Migration file here or select file above..."
                className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor="master-migration-file-input"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md select-none tracking-wide"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Migration File (.csv / .json)</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setCsvText(''); setImportStatus(null); setImportError(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Clear Buffer
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (csvText.trim()) {
                    executeMigration(csvText);
                  } else {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }
                }}
                disabled={isProcessing}
                className="min-w-[200px] px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white tracking-wide active:scale-95 hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : isSuccessMorph ? (
                  <span className="inline-flex items-center gap-1.5 text-white font-bold animate-in zoom-in-75 duration-200">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Imported</span>
                  </span>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Incorporate Data into this PC ({importMode === 'merge' ? 'Safe Merge' : 'Full Overwrite'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Dedicated Departmental Sheet Exports */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
            Individual Departmental Spreadsheets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono text-amber-700 dark:text-amber-400">Books Catalog</span>
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Export Books & Copies</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Contains barcodes, ISBNs, shelf locations, total copies, and shelf availability.
                </p>
              </div>
              <button
                onClick={handleExportBooks}
                className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Books CSV</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono text-sky-700 dark:text-sky-400">Borrowers Roster</span>
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Export Campus Members</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Student IDs, departments, degree programs, campus emails, and contact records.
                </p>
              </div>
              <button
                onClick={handleExportBorrowers}
                className="w-full py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Borrowers CSV</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono text-purple-700 dark:text-purple-400">Circulation Desk</span>
                  <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Export Circulation Ledger</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete log of checkouts, due dates, return timestamps, and overdue statuses.
                </p>
              </div>
              <button
                onClick={handleExportTransactions}
                className="w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Loans CSV</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between space-y-3 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono text-emerald-700 dark:text-emerald-400">Audit History</span>
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Export System Audit Trail</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete operational audit trail with timestamps, workstation IDs, and actions.
                </p>
              </div>
              <button
                onClick={handleExportHistory}
                className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Audit Trail CSV</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExcelCenterView;
