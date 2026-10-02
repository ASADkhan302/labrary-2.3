import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  HardDrive, 
  Volume2, 
  CheckCircle2, 
  Building2, 
  Download,
  FolderOpen,
  Check,
  Sparkles,
  Loader2,
  Copy,
  ArrowRightLeft,
  ShieldCheck,
  Folder,
  Trash2
} from 'lucide-react';
import { SystemSettings } from '../types/library';
import { LibraryStorage } from '../services/storage';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetDemoData: () => void;
  onClearDemoData?: () => void;
  onPlayBootAnimation?: () => void;
  onOpenStorageModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearDemoData,
  onPlayBootAnimation,
  onOpenStorageModal,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [institutionalSaved, setInstitutionalSaved] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [moveNotice, setMoveNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);

  const storageConfig = LibraryStorage.getStorageLocation();
  const currentDbPath = storageConfig.folderPath 
    ? `${storageConfig.folderPath}\\ULM_Library.db`
    : (formData.db_path || 'C:\\Users\\Admin\\Documents\\ULM Library\\ULM_Library.db');

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(currentDbPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleOpenFolder = () => {
    // In web environment, simulate opening or prompt folder handle
    setMoveNotice(`Folder location: "${storageConfig.folderPath || 'Documents\\ULM Library'}"`);
    setTimeout(() => setMoveNotice(null), 3500);
  };

  const handleMoveData = () => {
    if (onOpenStorageModal) {
      onOpenStorageModal();
    }
  };

  const handleSwitchDatabase = () => {
    if (onOpenStorageModal) {
      onOpenStorageModal();
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const updated: SystemSettings = { ...formData };
      LibraryStorage.saveSettings(updated);
      onUpdateSettings(updated);
      setIsSaving(false);
      setIsSaved(true);
      setSaveSuccess(true);
      setInstitutionalSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setSaveSuccess(false);
        setInstitutionalSaved(false);
      }, 1200);
    }, 200);
  };

  const handleBackupDatabase = () => {
    const backupObj = {
      timestamp: new Date().toISOString(),
      station: formData.station_id,
      books: LibraryStorage.getBooks(),
      borrowers: LibraryStorage.getBorrowers(),
      transactions: LibraryStorage.getTransactions(),
      history: LibraryStorage.getHistory(),
      settings: formData,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ULM_LMS_Database_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>Campus System Preferences & Hardware Configuration</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure institutional credentials, workstation peripheral hooks, appearance, and local SQLite data.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[150px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-md tracking-wide transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isSaved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-950 font-bold animate-in zoom-in-75 duration-200">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved</span>
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Settings successfully committed to local SQLite database.</span>
          </div>
        )}

        {/* Workstation Diagnostics & Boot Animation Ceremony */}
        {onPlayBootAnimation && (
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 shadow-2xs transition-colors flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>App Opening Animation Ceremony</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Play the university workstation boot sequence and diagnostic seal animation.
              </p>
            </div>

            <button
              type="button"
              onClick={onPlayBootAnimation}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>⚡ Play Boot Intro</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Information */}
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-5 shadow-2xs transition-colors">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F1F5F9] leading-tight">
                    Institutional Identity & Campus Header Details
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Modifies university name, library sub-header, and contact credentials live across the application.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                Live System Header Branding
              </span>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                  University / Institution Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.university_name}
                  onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                  placeholder="e.g. University of Lakki Marwat"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Displayed in native Windows title bar, top navigation header, and member ID cards.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                  Library Facility / Department Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.library_name}
                  onChange={(e) => setFormData({ ...formData, library_name: e.target.value })}
                  placeholder="e.g. Central Campus Library"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Displayed as primary library header, sidebar campus title, and circulation receipts.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                  Campus Physical Address
                </label>
                <input
                  type="text"
                  value={formData.campus_address}
                  onChange={(e) => setFormData({ ...formData, campus_address: e.target.value })}
                  placeholder="e.g. Main Campus, Bannu-Mianwali Road, Lakki Marwat, KPK, Pakistan"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Printed on institutional circulation vouchers, export manifests, and overdue notices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                  Official Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +92-969-510015"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Circulation desk helpline for book renewals and student queries.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                  Official Circulation Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. library@ulm.edu.pk"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F1F5F9] focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
                />
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                  Institutional contact address for inter-library loan requests.
                </p>
              </div>
            </div>

            {/* Live Header Branding Preview */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/[0.03] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Title Bar &amp; Header Preview</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                <span className="font-bold text-[#F1F5F9] font-cinzel">
                  {formData.university_name.trim() || 'University of Lakki Marwat'}
                </span>
                <span className="text-amber-500/70 font-sans">|</span>
                <span className="text-amber-700 dark:text-amber-400 font-cinzel">
                  {formData.library_name.trim() || 'Central Campus Library'}
                </span>
              </div>
            </div>

            {/* Dedicated Apply Action Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
                Click <strong>Apply Details to App</strong> to instantly synchronize headers, title bars, and commit changes to local SQLite storage.
              </p>

              <div className="flex items-center gap-3">
                {institutionalSaved && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Applied to App!</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Apply Details to App</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hardware & Peripheral Scanner Settings */}
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F9] border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Barcode Scanner & Peripherals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#020617]">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Hardware Audio Feedback</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Play pleasant frequency chirp on barcode detection</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.scanner_sound}
                  onChange={(e) => setFormData({ ...formData, scanner_sound: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#020617]">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Auto-Submit Scan</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Execute search immediately upon receiving 13-digit EAN</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_submit_scan}
                  onChange={(e) => setFormData({ ...formData, auto_submit_scan: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Workstation Node ID
                </label>
                <input
                  type="text"
                  value={formData.station_id}
                  onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Windows Title Bar Badge
                </label>
                <div className="p-2 rounded-lg border border-slate-200 dark:border-[#334155] text-xs font-mono bg-slate-50 dark:bg-[#020617] text-slate-600 dark:text-slate-400">
                  Visible in native top bar: <span className="text-amber-600 dark:text-amber-400 font-bold">{formData.station_id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local SQLite Database Storage & Repository (%APPDATA%\ULM Library\config.ini) */}
          <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F9]">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>Library Storage Repository (%APPDATA%\ULM Library\config.ini)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40">
                WAL MODE · SINGLE-INSTANCE LOCK ACTIVE
              </span>
            </div>

            {/* Current Active Path Row */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Active SQLite Database File Path:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentDbPath}
                  className="flex-1 rounded-lg px-3 py-2 text-xs font-mono select-all border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#020617] text-slate-800 dark:text-sky-300"
                />
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#334155] bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Open folder in Windows Explorer"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Folder</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#334155] bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copy full database file path to clipboard"
                >
                  {copiedPath ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Path</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Storage Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleMoveData}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Move Data to a New Folder...</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchDatabase}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#334155] bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>Switch to Another Existing Database...</span>
              </button>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                *Moving data creates a safety backup, copies via VACUUM INTO, verifies counts, and preserves original file.
              </span>
            </div>

            {moveNotice && (
              <div className="p-2.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono">
                {moveNotice}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={handleBackupDatabase}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#334155] bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Export SQLite Database JSON Snapshot</span>
              </button>

              <div className="flex items-center gap-2">
                {confirmClearDemo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Clear 8 demo members?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClearDemoData) onClearDemoData();
                        else {
                          LibraryStorage.clearDemoData();
                        }
                        setConfirmClearDemo(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearDemo(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearDemo(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                    title="Clear sample demo people (notes = 'DEMO')"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Clear Demo Data</span>
                  </button>
                )}

                {confirmReset ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Restore 8 titles & 42 copies?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetDemoData();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-[#F1F5F9] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Demo Catalog (8 Books, 42 Copies)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
export default SettingsView;
