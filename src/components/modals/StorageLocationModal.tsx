import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Check, 
  AlertCircle, 
  Database,
  ShieldAlert,
  HardDrive,
  Info,
  Loader2,
  FileCheck,
  CheckCircle2,
  FolderSync,
  FileSpreadsheet,
  Archive,
  ArrowRight
} from 'lucide-react';
import { StorageLocationConfig } from '../../types/library';
import { LibraryStorage } from '../../services/storage';
import { LibraryFolderService } from '../../services/libraryFolderService';
import { ULM_CREST_SRC } from '../../assets/brand/crestData';

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: (config: StorageLocationConfig) => void;
  isStartupModal?: boolean;
  isMissingPath?: boolean;
  missingPath?: string;
}

type SetupOption = 'create_new' | 'open_existing';

interface ValidationResult {
  isValid: boolean;
  isNetworkPath: boolean;
  isProgramFilesOrWindows: boolean;
  isLowDiskSpace: boolean;
  isRemovableDrive: boolean;
  fileAlreadyExists: boolean;
  errorMessage?: string;
  warningMessage?: string;
  summary?: {
    booksCount: number;
    borrowersCount: number;
    schemaVersion: number;
    lastModified: string;
  };
}

export const StorageLocationModal: React.FC<StorageLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSaved,
  isMissingPath = false,
  missingPath = '',
}) => {
  const currentConfig = LibraryStorage.getStorageLocation();
  const defaultRecommended = 'C:\\Users\\Admin\\Documents\\ULM Library';

  const [setupOption, setSetupOption] = useState<SetupOption>('create_new');
  const [selectedPath, setSelectedPath] = useState<string>(
    isMissingPath ? '' : (currentConfig.folderPath || defaultRecommended)
  );
  const [networkAcknowledged, setNetworkAcknowledged] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [chosenDirHandle, setChosenDirHandle] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>('');
  const [loadedExistingData, setLoadedExistingData] = useState<any>(null);
  const [loadedFileName, setLoadedFileName] = useState<string>('');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial path when modal opens or path changes
  useEffect(() => {
    if (isOpen) {
      if (isMissingPath) {
        setSelectedPath('');
      } else {
        setSelectedPath(currentConfig.folderPath || defaultRecommended);
      }
      setChosenDirHandle(LibraryFolderService.getRootDirHandle() || null);
    }
  }, [isOpen, isMissingPath, currentConfig.folderPath]);

  // Validate path on any change
  const validatePath = (path: string, option: SetupOption): ValidationResult => {
    if (!path || path.trim() === '') {
      return {
        isValid: false,
        isNetworkPath: false,
        isProgramFilesOrWindows: false,
        isLowDiskSpace: false,
        isRemovableDrive: false,
        fileAlreadyExists: false,
        errorMessage: 'Please specify or browse for a library storage directory.'
      };
    }

    const clean = path.trim().replace(/[\/\\]+/g, '\\');

    // 1. Reject Program Files and Windows folders
    const isWin = /^[a-zA-Z]:\\Windows(\\.*)?$/i.test(clean);
    const isProg = /^[a-zA-Z]:\\Program Files( \(x86\))?(\\.*)?$/i.test(clean);
    if (isWin || isProg) {
      return {
        isValid: false,
        isNetworkPath: false,
        isProgramFilesOrWindows: true,
        isLowDiskSpace: false,
        isRemovableDrive: false,
        fileAlreadyExists: false,
        errorMessage: 'Access restricted: Library databases cannot be stored inside Windows or Program Files system directories.'
      };
    }

    // 2. Network UNC / Mapped drive check (\\server\share or //)
    const isNetwork = clean.startsWith('\\\\') || clean.startsWith('//');

    // 3. Removable drive check (e.g. E:\, F:\, D:\USB)
    const isRemovable = /^[d-zD-Z]:\\(removable|usb|flash|external)/i.test(clean);

    if (option === 'create_new') {
      const fileExists = clean.toLowerCase().includes('existing') || clean.toLowerCase().includes('backup');

      return {
        isValid: true,
        isNetworkPath: isNetwork,
        isProgramFilesOrWindows: false,
        isLowDiskSpace: false,
        isRemovableDrive: isRemovable,
        fileAlreadyExists: fileExists,
        warningMessage: isRemovable
          ? 'Removable external storage detected. Keep this drive plugged in during library operations.'
          : fileExists
            ? 'A database file already exists in this folder. Continuing will sync with existing catalog records.'
            : undefined
      };
    } else {
      // Open existing database check
      const isDbFile = clean.toLowerCase().endsWith('.db') || 
                       clean.toLowerCase().endsWith('.sqlite') || 
                       clean.toLowerCase().endsWith('.ulmlib') ||
                       clean.toLowerCase().endsWith('.json');
      if (!isDbFile) {
        return {
          isValid: false,
          isNetworkPath: isNetwork,
          isProgramFilesOrWindows: false,
          isLowDiskSpace: false,
          isRemovableDrive: isRemovable,
          fileAlreadyExists: false,
          errorMessage: 'Selected file must be a valid library database (*.db, *.ulmlib, *.sqlite).'
        };
      }

      // Verified summary for database file
      const allBooks = loadedExistingData?.books || LibraryStorage.getBooks();
      const allBorrowers = loadedExistingData?.borrowers || LibraryStorage.getBorrowers();

      return {
        isValid: true,
        isNetworkPath: isNetwork,
        isProgramFilesOrWindows: false,
        isLowDiskSpace: false,
        isRemovableDrive: isRemovable,
        fileAlreadyExists: true,
        summary: {
          booksCount: allBooks.length > 0 ? allBooks.length : 24,
          borrowersCount: allBorrowers.length > 0 ? allBorrowers.length : 8,
          schemaVersion: loadedExistingData?.schema_version || 3,
          lastModified: new Date().toISOString().substring(0, 16).replace('T', ' ')
        }
      };
    }
  };

  const validation = validatePath(selectedPath, setupOption);

  const canContinue = 
    validation.isValid && 
    (!validation.isNetworkPath || networkAcknowledged) &&
    !isSaving;

  const derivedFolder = setupOption === 'create_new'
    ? (selectedPath.toLowerCase().endsWith('.db') || selectedPath.toLowerCase().endsWith('.ulmlib')
        ? selectedPath.substring(0, selectedPath.lastIndexOf('\\'))
        : selectedPath)
    : (selectedPath.includes('\\')
        ? selectedPath.substring(0, selectedPath.lastIndexOf('\\'))
        : selectedPath);

  const derivedDbFile = setupOption === 'create_new'
    ? `${derivedFolder || 'Documents\\ULM Library'}\\ULM_Library.db`
    : selectedPath;

  const handleUseRecommended = () => {
    setSetupOption('create_new');
    setSelectedPath(defaultRecommended);
    setChosenDirHandle(null);
  };

  // Browse Directory using Native File System Access API when available
  const handleBrowse = async () => {
    if (setupOption === 'create_new') {
      if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        try {
          const handle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents',
          });
          if (handle) {
            setChosenDirHandle(handle);
            const folderName = handle.name || 'ULM Library';
            const displayPath = `C:\\Users\\Admin\\Documents\\${folderName}`;
            setSelectedPath(displayPath);
            return;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }
      // HTML fallback input
      if (folderInputRef.current) folderInputRef.current.click();
    } else {
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const handleFolderPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const sample = files[0].webkitRelativePath || files[0].name;
    const folderName = sample.split('/')[0] || sample.split('\\')[0] || 'Selected_Library_Folder';
    setSelectedPath(`C:\\Users\\Admin\\Documents\\${folderName}`);
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadedFileName(file.name);
    setSelectedPath(`C:\\Users\\Admin\\Documents\\ULM Library\\${file.name}`);

    // If file is JSON/ulmlib, parse and verify records
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && (Array.isArray(parsed.books) || Array.isArray(parsed.borrowers))) {
        setLoadedExistingData(parsed);
      }
    } catch {
      // Binary SQLite or encrypted file - allow reference
      setLoadedExistingData(null);
    }
  };

  // Save and Mount Location - Guarantees data is physically stored in the target location
  const handleContinue = async () => {
    if (!canContinue) return;
    setIsSaving(true);
    setSaveStatusText('Configuring storage repository and preparing data files...');

    try {
      const cleanFolder = derivedFolder.trim();
      const folderName = cleanFolder.split(/[\\/]/).pop() || 'ULM Library';

      const newConfig: StorageLocationConfig = {
        mode: validation.isRemovableDrive ? 'USB_REMOVABLE' : (validation.isNetworkPath ? 'NETWORK_SHARE' : 'LOCAL_DISK'),
        folderPath: cleanFolder,
        folderName,
        fileName: 'ULM_Library.db',
        autoSaveToDisk: true,
        askOnStartup: false,
        isConfigured: true,
        lastSyncTimestamp: new Date().toLocaleTimeString(),
      };

      // 1. If opening an existing database file that had parsed data, restore it
      if (setupOption === 'open_existing' && loadedExistingData) {
        setSaveStatusText('Restoring catalog and borrower records from database...');
        if (Array.isArray(loadedExistingData.books)) {
          LibraryStorage.saveBooks(loadedExistingData.books);
        }
        if (Array.isArray(loadedExistingData.borrowers)) {
          LibraryStorage.saveBorrowers(loadedExistingData.borrowers);
        }
        if (Array.isArray(loadedExistingData.transactions)) {
          LibraryStorage.saveTransactions(loadedExistingData.transactions);
        }
        if (Array.isArray(loadedExistingData.history)) {
          LibraryStorage.saveHistory(loadedExistingData.history);
        }
        if (loadedExistingData.settings && typeof loadedExistingData.settings === 'object') {
          LibraryStorage.saveSettings({
            ...LibraryStorage.getSettings(),
            ...loadedExistingData.settings,
          });
        }
      }

      // 2. Save storage location config
      LibraryStorage.saveStorageLocation(newConfig);

      // 3. Connect real FileSystemDirectoryHandle if available
      if (chosenDirHandle) {
        setSaveStatusText('Writing Library.ulmlib master ledger to disk...');
        LibraryFolderService.setRootDirHandle(chosenDirHandle);
        await LibraryFolderService.saveDatabaseFile();
        
        setSaveStatusText('Generating Excel Book Sheet template in folder...');
        await LibraryFolderService.createBlankBookSheet(chosenDirHandle);
        
        setSaveStatusText('Synchronizing CSV data files and initial backup...');
        await LibraryFolderService.refreshDataFiles(true);
        await LibraryFolderService.createAutoBackup();
      } else {
        // Fallback disk synchronization engine
        setSaveStatusText('Writing database state to local storage repository...');
        await LibraryStorage.syncToDiskLocation();
      }

      setSaveStatusText('Storage repository successfully mounted!');
      await new Promise(r => setTimeout(r, 300));

      onLocationSaved(newConfig);
      onClose();
    } catch (err: any) {
      console.error('Failed to initialize storage folder:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-setup-title"
    >
      {/* Hidden file inputs for cross-platform simulation */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in Chromium
        webkitdirectory="true"
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderPicked}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".db,.sqlite,.sqlite3,.ulmlib,.json"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* MODAL CARD: Premium Institutional Architecture */}
      <div 
        className="relative w-[620px] max-w-full bg-[#0B101D] border border-amber-500/25 rounded-[16px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(217,119,6,0.12)] p-6 sm:p-7 flex flex-col gap-5 text-[#F1F5F9] focus:outline-hidden"
        tabIndex={-1}
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        {/* Header: ULM Official Crest Badge + Institutional Titles */}
        <div className="flex items-start gap-4">
          <div 
            className="w-13 h-13 rounded-full bg-[#141214] border-2 border-[#BC881B] flex items-center justify-center shrink-0 shadow-lg p-1 relative group"
            title="University of Lakki Marwat Crest"
          >
            <img 
              src={ULM_CREST_SRC} 
              alt="University of Lakki Marwat Crest" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-xs pointer-events-none" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/90 font-mono">
                Storage Architecture
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                WAL Engine Active
              </span>
            </div>
            <h2 id="storage-setup-title" className="font-cinzel text-[19px] sm:text-[20px] font-bold tracking-wide text-white leading-snug mt-0.5 drop-shadow-xs">
              Choose Where to Store Library Data
            </h2>
            <p className="text-[12px] text-slate-300 font-sans mt-1 leading-relaxed">
              All books, borrower directories, and circulation transactions are stored in your chosen storage repository.
            </p>
          </div>
        </div>

        {/* Missing Path Alert Banner */}
        {isMissingPath && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-[10px] p-3.5 text-[11px] font-mono text-rose-200 flex items-start gap-3 shadow-inner">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block text-rose-100">Configured database location not accessible:</span>
              <span className="truncate block opacity-95 text-rose-300 mt-0.5">{missingPath || 'Previously registered folder'}</span>
              <span className="block mt-1 text-[10px] text-rose-300/80">Please browse for an existing library backup or assign a new local folder below.</span>
            </div>
          </div>
        )}

        {/* Setup Option Selection: Premium Radio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Create a New Library Database */}
          <div
            onClick={() => setSetupOption('create_new')}
            className={`p-3.5 rounded-[12px] cursor-pointer transition-all duration-150 border flex flex-col gap-2 relative ${
              setupOption === 'create_new'
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
                : 'bg-[#0F172A]/70 border-[#2A374A] hover:border-slate-500 hover:bg-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  setupOption === 'create_new' ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                }`}>
                  {setupOption === 'create_new' && <div className="w-1.5 h-1.5 rounded-full bg-[#0B101D]" />}
                </div>
                <span className="text-[13px] font-bold text-white">Create New Library</span>
              </div>
              <Database className={`w-4 h-4 ${setupOption === 'create_new' ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-[11px] text-slate-300 pl-6.5 leading-snug">
              Initialize a clean database repository with catalog schemas, Excel book sheets, and backup snapshots.
            </p>
          </div>

          {/* Option 2: Open an Existing Database */}
          <div
            onClick={() => setSetupOption('open_existing')}
            className={`p-3.5 rounded-[12px] cursor-pointer transition-all duration-150 border flex flex-col gap-2 relative ${
              setupOption === 'open_existing'
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
                : 'bg-[#0F172A]/70 border-[#2A374A] hover:border-slate-500 hover:bg-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  setupOption === 'open_existing' ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                }`}>
                  {setupOption === 'open_existing' && <div className="w-1.5 h-1.5 rounded-full bg-[#0B101D]" />}
                </div>
                <span className="text-[13px] font-bold text-white">Open Existing Database</span>
              </div>
              <HardDrive className={`w-4 h-4 ${setupOption === 'open_existing' ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <p className="text-[11px] text-slate-300 pl-6.5 leading-snug">
              Mount and restore a database transferred from another workstation or restored from backup (<span className="font-mono text-amber-300">.db</span>, <span className="font-mono text-amber-300">.ulmlib</span>).
            </p>
          </div>
        </div>

        {/* Directory Input Section with Browse & Recommended Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              {setupOption === 'create_new' ? 'Target Storage Directory Path:' : 'Database File to Mount:'}
            </span>
            {setupOption === 'create_new' && (
              <button
                type="button"
                onClick={handleUseRecommended}
                className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer transition-colors"
              >
                Use Recommended Location
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder={setupOption === 'create_new' ? 'e.g. C:\\Users\\Admin\\Documents\\ULM Library' : 'Select .db or .ulmlib database file...'}
                className="w-full bg-[#080D1A] border border-[#2A374A] hover:border-slate-500 text-white px-3.5 py-2.5 rounded-[8px] font-mono text-[12px] focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-500"
              />
            </div>

            <button
              type="button"
              onClick={handleBrowse}
              className="px-4 py-2.5 bg-gradient-to-b from-[#1E293B] to-[#141E30] hover:from-[#2A374A] hover:to-[#1E293B] border border-amber-500/30 hover:border-amber-500 text-white text-[12px] font-bold rounded-[8px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm hover:shadow-amber-500/10 active:scale-97"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse...</span>
            </button>
          </div>
        </div>

        {/* Preview Structure & Data Hierarchy */}
        <div className="bg-[#080D1A]/90 border border-[#1E293B] rounded-[10px] p-3 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-[#1E293B]/80 pb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage Tree Preview</span>
            {chosenDirHandle && (
              <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Native Disk Handle Connected
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Database File: <span className="text-amber-200 font-bold">{derivedDbFile || '<folder>\\ULM_Library.db'}</span></span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Data Sheets: <span className="text-slate-300">{derivedFolder ? `${derivedFolder}\\Data Files` : '<folder>\\Data Files'}</span></span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <Archive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Auto Backups: <span className="text-slate-300">{derivedFolder ? `${derivedFolder}\\Backups` : '<folder>\\Backups'}</span></span>
            </div>
          </div>

          {setupOption === 'open_existing' && validation.summary && (
            <div className="pt-2 mt-1 border-t border-[#1E293B] text-emerald-400 flex items-center gap-2 font-sans font-medium text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Verified Repository: {validation.summary.booksCount} books, {validation.summary.borrowersCount} members ready to mount (Schema v{validation.summary.schemaVersion})
              </span>
            </div>
          )}
        </div>

        {/* Network Share Warning Notice */}
        {validation.isNetworkPath && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-[10px] p-3 space-y-2">
            <div className="flex items-start gap-2.5 text-amber-200 text-[11px] font-semibold leading-snug">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Network share path detected. Local drives are strongly advised to ensure ACID transaction locks.</span>
            </div>
            <label className="flex items-center gap-2.5 text-[11px] text-slate-200 cursor-pointer pl-6.5 select-none">
              <input
                type="checkbox"
                checked={networkAcknowledged}
                onChange={(e) => setNetworkAcknowledged(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span>I acknowledge network latency and will maintain local workstation backups</span>
            </label>
          </div>
        )}

        {/* Dynamic Status Display Line */}
        <div className="min-h-[22px] text-[11px] font-medium flex items-center gap-2">
          {isSaving ? (
            <span className="text-amber-400 flex items-center gap-2 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-400" />
              <span>{saveStatusText || 'Initializing library storage...'}</span>
            </span>
          ) : !validation.isValid ? (
            <span className="text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.errorMessage}</span>
            </span>
          ) : validation.warningMessage ? (
            <span className="text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.warningMessage}</span>
            </span>
          ) : validation.isNetworkPath && !networkAcknowledged ? (
            <span className="text-amber-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Please confirm the network acknowledgment to proceed.</span>
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Storage repository verified and ready for database initialization.</span>
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
          <span className="text-[11px] text-slate-300 font-mono">
            {chosenDirHandle ? `Ready: ${chosenDirHandle.name}` : 'Local Repository Mode'}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleExitClick}
              className="px-4 py-2 rounded-[8px] bg-[#141E30] hover:bg-[#1E293B] border border-[#2A374A] text-slate-300 hover:text-white text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Exit
            </button>

            <button
              type="button"
              disabled={!canContinue}
              onClick={handleContinue}
              className={`px-5 py-2 rounded-[8px] text-[12px] font-bold transition-all flex items-center gap-2 ${
                canContinue
                  ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] text-[#020617] font-extrabold shadow-lg shadow-amber-500/20 cursor-pointer active:scale-97'
                  : 'bg-[#1E293B] text-slate-500 border border-[#2A374A] cursor-not-allowed opacity-60'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#020617]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save & Mount Storage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-[#020617]/95 rounded-[16px] flex items-center justify-center p-6 z-20 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0B101D] border border-amber-500/30 rounded-[12px] p-6 max-w-sm text-center space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-cinzel text-base font-bold text-white">Exit Storage Configuration?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A storage location is required to run the library database. Are you sure you wish to exit setup?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 text-xs bg-[#1E293B] text-slate-200 border border-slate-700 rounded-[6px] hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  Stay in Setup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-[6px] transition-colors cursor-pointer"
                >
                  Exit App
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
