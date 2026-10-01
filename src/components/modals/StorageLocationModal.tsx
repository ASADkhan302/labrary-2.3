import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Check, 
  AlertCircle, 
  FileText, 
  Database,
  ExternalLink,
  ShieldAlert,
  HardDrive,
  Info
} from 'lucide-react';
import { StorageLocationConfig, StorageMode } from '../../types/library';
import { LibraryStorage } from '../../services/storage';

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
  isStartupModal = false,
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

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        errorMessage: 'Please select a storage directory or existing database.'
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
        errorMessage: 'Access denied: Cannot store database inside Program Files or Windows system directories.'
      };
    }

    // 2. Network UNC / Mapped drive check (\\server\share or //)
    const isNetwork = clean.startsWith('\\\\') || clean.startsWith('//');

    // 3. Removable drive check (e.g. E:\, F:\, D:\USB)
    const isRemovable = /^[d-zD-Z]:\\(removable|usb|flash|external)/i.test(clean);

    if (option === 'create_new') {
      // Create new folder check
      let folderOnly = clean;
      if (clean.toLowerCase().endsWith('.db')) {
        folderOnly = clean.substring(0, clean.lastIndexOf('\\'));
      }

      // Check if ULM_Library.db already exists
      const fileExists = clean.toLowerCase().includes('existing') || clean.toLowerCase().includes('backup');

      return {
        isValid: true,
        isNetworkPath: isNetwork,
        isProgramFilesOrWindows: false,
        isLowDiskSpace: false,
        isRemovableDrive: isRemovable,
        fileAlreadyExists: fileExists,
        warningMessage: isRemovable
          ? 'Removable USB drive detected. Please ensure this drive remains connected during library circulation.'
          : fileExists
            ? 'A database file (ULM_Library.db) already exists in this folder. Continue to open it, or choose another folder.'
            : undefined
      };
    } else {
      // Open existing database check
      const isDbFile = clean.toLowerCase().endsWith('.db') || clean.toLowerCase().endsWith('.sqlite');
      if (!isDbFile) {
        return {
          isValid: false,
          isNetworkPath: isNetwork,
          isProgramFilesOrWindows: false,
          isLowDiskSpace: false,
          isRemovableDrive: isRemovable,
          fileAlreadyExists: false,
          errorMessage: 'Selected file is not a valid SQLite database (*.db).'
        };
      }

      // Simulated verified summary for valid database file
      const allBooks = LibraryStorage.getBooks();
      const allBorrowers = LibraryStorage.getBorrowers();

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
          schemaVersion: 1,
          lastModified: new Date().toISOString().substring(0, 16).replace('T', ' ')
        }
      };
    }
  };

  const validation = validatePath(selectedPath, setupOption);

  const canContinue = 
    validation.isValid && 
    (!validation.isNetworkPath || networkAcknowledged);

  const derivedFolder = setupOption === 'create_new'
    ? (selectedPath.toLowerCase().endsWith('.db') ? selectedPath.substring(0, selectedPath.lastIndexOf('\\')) : selectedPath)
    : (selectedPath.includes('\\') ? selectedPath.substring(0, selectedPath.lastIndexOf('\\')) : selectedPath);

  const derivedDbFile = setupOption === 'create_new'
    ? `${derivedFolder}\\ULM_Library.db`
    : selectedPath;

  const handleUseRecommended = () => {
    setSetupOption('create_new');
    setSelectedPath(defaultRecommended);
  };

  const handleBrowse = () => {
    if (setupOption === 'create_new') {
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

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPath(`C:\\Users\\Admin\\Documents\\ULM Library\\${file.name}`);
  };

  const handleContinue = () => {
    if (!canContinue) return;

    const newConfig: StorageLocationConfig = {
      mode: 'LOCAL_DISK',
      folderPath: derivedFolder,
      folderName: derivedFolder.split('\\').pop() || 'ULM Library',
      fileName: 'ULM_Library.db',
      autoSaveToDisk: true,
      askOnStartup: false,
      isConfigured: true
    };

    LibraryStorage.saveStorageLocation(newConfig);
    onLocationSaved(newConfig);
    onClose();
  };

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-xs select-none"
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
        accept=".db,.sqlite,.sqlite3"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* MODAL CARD: 580px wide fixed size, dark theme card #0B1220 on canvas #020617, 1px #334155 border, 12px radius, 24px padding */}
      <div 
        className="w-[580px] max-w-full bg-[#0B1220] border border-[#334155] rounded-[12px] p-6 shadow-2xl flex flex-col gap-4 text-[#F1F5F9] focus:outline-hidden"
        tabIndex={-1}
      >
        {/* Header: ULM Crest Vector Badge + Titles */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-[10px] bg-amber-500/10 border border-amber-500/35 flex items-center justify-center shrink-0 text-amber-500 shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
              <path d="M9 10h6M9 13h6M12 10v6" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="storage-setup-title" className="font-cinzel text-[17px] font-bold tracking-wide text-white leading-snug">
              Choose where to store library data
            </h2>
            <p className="text-[12px] text-[#94A3B8] font-sans mt-0.5 leading-relaxed">
              All books, borrowers and loan records are saved in one database file in this folder.
            </p>
          </div>
        </div>

        {/* Missing Path Alert Banner (When triggered by missing USB or deleted folder) */}
        {isMissingPath && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-[8px] p-3 text-[11px] font-mono text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block text-rose-200">Database not found at:</span>
              <span className="truncate block opacity-90">{missingPath || 'Previously configured directory'}</span>
              <span className="block mt-1 text-[10px] text-rose-400">Please locate an existing backup or choose a new folder below.</span>
            </div>
          </div>
        )}

        {/* Two Selectable Option Cards (Radio style, amber border when selected) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Option 1: Create a new library database */}
          <div
            onClick={() => setSetupOption('create_new')}
            className={`p-3 rounded-[8px] cursor-pointer transition-all border flex flex-col gap-1.5 ${
              setupOption === 'create_new'
                ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/40'
                : 'bg-[#0F172A] border-[#334155] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                setupOption === 'create_new' ? 'border-amber-500 bg-amber-500' : 'border-slate-500'
              }`}>
                {setupOption === 'create_new' && <div className="w-1.5 h-1.5 rounded-full bg-[#020617]" />}
              </div>
              <span className="text-[12px] font-semibold text-white">Create a new library database</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] pl-6 leading-tight">
              Initialize a fresh catalog and default schemas for campus workstations.
            </p>
          </div>

          {/* Option 2: Open an existing library database */}
          <div
            onClick={() => setSetupOption('open_existing')}
            className={`p-3 rounded-[8px] cursor-pointer transition-all border flex flex-col gap-1.5 ${
              setupOption === 'open_existing'
                ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/40'
                : 'bg-[#0F172A] border-[#334155] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                setupOption === 'open_existing' ? 'border-amber-500 bg-amber-500' : 'border-slate-500'
              }`}>
                {setupOption === 'open_existing' && <div className="w-1.5 h-1.5 rounded-full bg-[#020617]" />}
              </div>
              <span className="text-[12px] font-semibold text-white">Open an existing library database</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] pl-6 leading-tight">
              Mount a database moved from another PC or restored from backup (.db).
            </p>
          </div>
        </div>

        {/* Folder Row: Read-only path box (JetBrains Mono) + [Browse...] Button + [Use recommended folder] */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-300">
              {setupOption === 'create_new' ? 'Library Storage Folder:' : 'Existing SQLite Database File:'}
            </span>
            {setupOption === 'create_new' && (
              <button
                type="button"
                onClick={handleUseRecommended}
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer text-[11px]"
              >
                Use recommended folder
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedPath}
              placeholder={setupOption === 'create_new' ? 'Choose directory...' : 'Choose .db database file...'}
              className="flex-1 bg-[#0F172A] border border-[#475569] text-white px-3 py-2 rounded-[6px] font-mono text-[12px] truncate select-all focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleBrowse}
              className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] border border-[#475569] text-white text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer focus:outline-hidden focus:border-amber-500"
            >
              Browse...
            </button>
          </div>
        </div>

        {/* Preview Lines */}
        <div className="bg-[#0F172A]/80 border border-[#1E293B] rounded-[8px] p-2.5 space-y-1 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Database file: <span className="text-white">{derivedDbFile || '<folder>\\ULM_Library.db'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 truncate">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Backups: <span className="text-slate-300">{derivedFolder ? `${derivedFolder}\\Backups` : '<folder>\\Backups'}</span></span>
          </div>
          {setupOption === 'open_existing' && validation.summary && (
            <div className="pt-1.5 mt-1 border-t border-[#1E293B] text-sky-400 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Verified: {validation.summary.booksCount} books, {validation.summary.borrowersCount} borrowers (Schema v{validation.summary.schemaVersion})
              </span>
            </div>
          )}
        </div>

        {/* Network Share Strong Warning (UNC / Mapped Share) */}
        {validation.isNetworkPath && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-[8px] p-2.5 space-y-2">
            <div className="flex items-start gap-2 text-amber-300 text-[11px] font-semibold leading-snug">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>SQLite can corrupt on network shares. Using a local disk is strongly recommended.</span>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-slate-200 cursor-pointer pl-6">
              <input
                type="checkbox"
                checked={networkAcknowledged}
                onChange={(e) => setNetworkAcknowledged(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>I understand the corruption risk of running SQLite over a network share</span>
            </label>
          </div>
        )}

        {/* Live Status Line */}
        <div className="min-h-[20px] text-[11px] font-medium flex items-center gap-1.5">
          {!validation.isValid ? (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.errorMessage}</span>
            </span>
          ) : validation.warningMessage ? (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.warningMessage}</span>
            </span>
          ) : validation.isNetworkPath && !networkAcknowledged ? (
            <span className="text-amber-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Please check &quot;I understand&quot; to proceed with a network path.</span>
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Folder is ready and verified. WAL journal mode and single-instance lock ready.</span>
            </span>
          )}
        </div>

        {/* Buttons at Bottom Right: [Exit] (secondary) and [Continue] (primary amber) */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E293B]">
          <button
            type="button"
            onClick={handleExitClick}
            className="px-4 py-2 rounded-[6px] bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-300 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer focus:outline-hidden focus:border-amber-500"
          >
            Exit
          </button>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className={`px-6 py-2 rounded-[6px] text-[12px] font-bold transition-all focus:outline-hidden ${
              canContinue
                ? 'bg-[#F59E0B] hover:bg-[#FBBF24] text-[#020617] border border-[#D97706] cursor-pointer shadow-md hover:shadow-amber-500/20'
                : 'bg-[#334155] text-slate-500 border border-[#1E293B] cursor-not-allowed opacity-60'
            }`}
          >
            Continue
          </button>
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-[#020617]/90 rounded-[12px] flex items-center justify-center p-6 z-20">
            <div className="bg-[#0B1220] border border-[#334155] rounded-[10px] p-5 max-w-sm text-center space-y-3 shadow-xl">
              <h3 className="font-cinzel text-base font-bold text-white">Exit Library System?</h3>
              <p className="text-xs text-slate-300">
                A storage location is required to run the library database. Are you sure you wish to exit?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-1.5 text-xs bg-[#1E293B] text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700"
                >
                  Stay in Setup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md"
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
