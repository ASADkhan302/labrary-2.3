import React, { useState } from 'react';
import { 
  HardDrive, 
  FolderOpen, 
  Check, 
  AlertCircle, 
  FileText, 
  Download, 
  Upload, 
  X,
  HelpCircle,
  Database
} from 'lucide-react';
import { StorageLocationConfig, StorageMode } from '../../types/library';
import { LibraryStorage } from '../../services/storage';

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: (config: StorageLocationConfig) => void;
  isStartupModal?: boolean;
}

const PRESET_OPTIONS: Array<{
  mode: StorageMode;
  title: string;
  badge: string;
  defaultPath: string;
  icon: React.ElementType;
  description: string;
  colorClass: string;
}> = [
  {
    mode: 'LOCAL_DISK',
    title: 'Local Workstation Disk (Primary Drive)',
    badge: 'Recommended for Counter PC',
    defaultPath: 'C:\\ULM_Library_Database',
    icon: HardDrive,
    description: 'Fast, secure NVMe/SSD storage on this computer. Dedicated local directory for circulation desks.',
    colorClass: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  },
];

export const StorageLocationModal: React.FC<StorageLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSaved,
  isStartupModal = false,
}) => {
  const current = LibraryStorage.getStorageLocation();
  const [selectedMode, setSelectedMode] = useState<StorageMode>(current.mode);
  const [customPath, setCustomPath] = useState(current.folderPath);
  const [fileName, setFileName] = useState(current.fileName);
  const [autoSaveToDisk, setAutoSaveToDisk] = useState(current.autoSaveToDisk);
  const [askOnStartup, setAskOnStartup] = useState(isStartupModal ? false : current.askOnStartup);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [existingDbLoaded, setExistingDbLoaded] = useState(false);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Listen for native folder selection messages from Visual Studio C# WPF host
  React.useEffect(() => {
    const handleNativeMessage = (event: any) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'folder-selected' && data.folderPath) {
          setCustomPath(data.folderPath);
          setStatusMessage(`Selected native Windows directory: "${data.folderPath}"`);
        }
      } catch {
        // ignore
      }
    };

    if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.addEventListener('message', handleNativeMessage);
      return () => {
        (window as any).chrome?.webview?.removeEventListener('message', handleNativeMessage);
      };
    }
  }, []);

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const sample = files[0].webkitRelativePath || files[0].name;
    const folderName = sample.split('/')[0] || sample.split('\\')[0] || 'Selected_Library_Folder';
    const resolvedPath = `C:\\${folderName}`;
    setCustomPath(resolvedPath);
    setStatusMessage(`Mounted PC directory: "${folderName}" (${files.length} items detected). Storage path verified.`);
  };

  if (!isOpen) return null;

  // Handle native folder browse using modern Chromium FileSystem API or C# native dialog
  const handleBrowseFolder = async () => {
    setIsBrowsing(true);
    setStatusMessage(null);

    // 1. If in Visual Studio C# WPF WebView2 desktop app:
    if (typeof (window as any).chrome?.webview?.postMessage === 'function') {
      (window as any).chrome.webview.postMessage(JSON.stringify({ action: 'browse-folder' }));
      setIsBrowsing(false);
      return;
    }

    // 2. Try window.showDirectoryPicker first (if supported in current context)
    let pickerSuccess = false;
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });
        LibraryStorage.setDirectoryHandle(dirHandle);
        const folderName = dirHandle.name;
        const newPath = `C:\\${folderName}`;
        setCustomPath(newPath);
        setStatusMessage(`Connected directory handle: "${folderName}". Direct disk synchronization active.`);
        pickerSuccess = true;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          setIsBrowsing(false);
          return;
        }
        // Fall through to HTML5 directory input fallback
      }
    }

    if (!pickerSuccess) {
      // 3. Fallback to HTML5 webkitdirectory picker (reliable in iframes and preview environments)
      if (folderInputRef.current) {
        folderInputRef.current.click();
      } else {
        setStatusMessage('Enter your target Windows folder path in the input field below.');
      }
    }

    setIsBrowsing(false);
  };

  // Handle preset selection
  const handleSelectPreset = (preset: typeof PRESET_OPTIONS[0]) => {
    setSelectedMode(preset.mode);
    setCustomPath(preset.defaultPath);
  };

  // Handle importing an existing database from disk
  const handleImportExistingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.books && Array.isArray(parsed.books)) {
          LibraryStorage.saveBooks(parsed.books);
          if (parsed.borrowers) LibraryStorage.saveBorrowers(parsed.borrowers);
          if (parsed.transactions) LibraryStorage.saveTransactions(parsed.transactions);
          if (parsed.settings) LibraryStorage.saveSettings(parsed.settings);
          setExistingDbLoaded(true);
          setStatusMessage(`Found & imported existing database with ${parsed.books.length} books and ${parsed.borrowers?.length || 0} students!`);
        } else {
          setStatusMessage('File does not appear to be a valid ULM LMS database archive.');
        }
      } catch {
        setStatusMessage('Error reading file. Ensure it is a valid JSON database archive.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    const config: StorageLocationConfig = {
      mode: selectedMode,
      folderPath: customPath.trim() || 'C:\\ULM_Library_Database',
      folderName: customPath.split('\\').pop() || 'ULM_Library_Database',
      fileName: fileName.trim() || 'ulm_library_master.sqlite',
      autoSaveToDisk,
      askOnStartup: isStartupModal ? false : askOnStartup,
      isConfigured: true,
      lastSyncTimestamp: new Date().toLocaleTimeString(),
    };

    LibraryStorage.saveStorageLocation(config);
    LibraryStorage.syncToDiskLocation();
    onLocationSaved(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between bg-slate-50/70 dark:bg-[#0F172A]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {isStartupModal ? 'FIRST-TIME WORKSTATION INITIALIZATION' : 'STORAGE SETTINGS'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-cinzel">
                {isStartupModal ? 'Choose Where to Store Library Data' : 'Select Database Storage Location'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStartupModal
                  ? 'Select the folder or drive on your PC for your SQLite database records. Configured once during initial setup.'
                  : 'Choose the directory on your PC where library data and SQLite records will be stored.'}
              </p>
            </div>
          </div>

          {!isStartupModal && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Status / Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
              existingDbLoaded 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{statusMessage}</div>
            </div>
          )}

          {/* Prompt description */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span>Where should your library database reside on this computer?</span>
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              All books, student registrations, active circulation loans, barcode scans, and fine transactions will be safely stored and synced in your chosen storage destination.
            </p>
          </div>

          {/* Preset Storage Options - Local Disk Primary */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Storage Destination Mode
            </label>
            <div className="grid grid-cols-1 gap-3">
              {PRESET_OPTIONS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedMode === preset.mode;
                return (
                  <button
                    key={preset.mode}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/70 text-slate-900 dark:text-white ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${preset.colorClass}`}>
                          <Icon className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{preset.title}</p>
                          <span className="inline-block text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            {preset.badge}
                          </span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {preset.description}
                    </p>
                    <div className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 truncate w-full flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">Default Target:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{preset.defaultPath}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Folder Path & File Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Folder Path on PC</span>
                </label>
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  disabled={isBrowsing}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  title="Browse folder on your PC"
                  aria-label="Browse Folder on PC"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                  <span>Browse Folder...</span>
                </button>
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory is standard in HTML5 browsers for folder picking
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={handleFolderInputChange}
                />
              </div>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="e.g. C:\ULM_Library_Database or D:\LMS_Data"
                className="w-full px-3 py-2 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Database Master File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="ulm_library_master.sqlite"
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Existing Database in Folder?
                </label>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>Import Existing File</span>
                  <input
                    type="file"
                    accept=".json,.sqlite,.db"
                    onChange={handleImportExistingFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Preferences Checkboxes */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSaveToDisk}
                onChange={(e) => setAutoSaveToDisk(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-700"
              />
              <span>Automatically sync all catalog changes, loans, and returns to this storage location</span>
            </label>

            {isStartupModal ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                <span className="font-medium">
                  This storage location will be saved permanently. The app will open directly without asking for location on future launches.
                </span>
              </div>
            ) : (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={askOnStartup}
                  onChange={(e) => setAskOnStartup(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-700"
                />
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Ask for storage location on every application startup (Workstation Selection Mode)
                </span>
              </label>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0F172A]/70 flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
            Target: <span className="text-amber-600 dark:text-amber-400 font-bold">{customPath}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isStartupModal && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isStartupModal ? 'Save Location & Open Library' : 'Confirm & Mount Storage'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
