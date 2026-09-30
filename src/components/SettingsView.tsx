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
  Palette,
  Sun,
  Moon,
  Laptop,
  FolderOpen,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SystemSettings, LightThemeStyle } from '../types/library';
import { LibraryStorage } from '../services/storage';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LIGHT_THEME_OPTIONS: Array<{
  id: LightThemeStyle;
  name: string;
  isDefault?: boolean;
  page: string;
  card: string;
  raised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  description: string;
}> = [
  {
    id: 'blue-gray',
    name: 'Blue-Gray',
    isDefault: true,
    page: '#EEF2F7',
    card: '#F8FAFC',
    raised: '#E6ECF4',
    border: '#D5DDE8',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#5B6B80',
    description: 'Crisp campus slate',
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    page: '#F5F1E8',
    card: '#FBF8F1',
    raised: '#EDE7D9',
    border: '#DDD5C3',
    textPrimary: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#64594B',
    description: 'Archival parchment tone',
  },
  {
    id: 'sage-green',
    name: 'Sage Green',
    page: '#EDF3EF',
    card: '#F6FAF7',
    raised: '#E1EBE4',
    border: '#D3E0D8',
    textPrimary: '#0F1F17',
    textSecondary: '#2F4A3B',
    textMuted: '#52665A',
    description: 'Botanical eye comfort',
  },
  {
    id: 'mist-lavender',
    name: 'Mist Lavender',
    page: '#F1F0F8',
    card: '#FAFAFE',
    raised: '#E8E6F3',
    border: '#D9D6EA',
    textPrimary: '#17152B',
    textSecondary: '#3B3757',
    textMuted: '#5F5B7D',
    description: 'Academic lilac mist',
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    page: '#E2E8F0',
    card: '#F1F5F9',
    raised: '#D3DCE8',
    border: '#BCC8D8',
    textPrimary: '#0F172A',
    textSecondary: '#1E293B',
    textMuted: '#475569',
    description: 'Executive neutral',
  },
];

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetDemoData: () => void;
  onPlayBootAnimation?: () => void;
  onOpenStorageModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onPlayBootAnimation,
  onOpenStorageModal,
}) => {
  const { theme, isDark, toggleTheme, setTheme, lightThemeStyle, setLightThemeStyle } = useTheme();
  const [formData, setFormData] = useState<SystemSettings>({ 
    ...settings, 
    theme: settings.theme || (isDark ? 'dark' : 'light'),
    light_theme_style: settings.light_theme_style || lightThemeStyle,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [institutionalSaved, setInstitutionalSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...settings,
      theme: isDark ? 'dark' : 'light',
      light_theme_style: lightThemeStyle,
    }));
  }, [settings, isDark, lightThemeStyle]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const updated: SystemSettings = { 
        ...formData, 
        theme: isDark ? 'dark' : 'light',
        light_theme_style: lightThemeStyle,
      };
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
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
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

        {/* APPEARANCE & THEME CONFIGURATION SECTION */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Appearance & Display Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active: <strong className="text-slate-800 dark:text-slate-200">{isDark ? 'Dark Theme' : 'Light Theme'}</strong>
              </span>
              <ThemeToggle 
                variant="amber"
                isDark={isDark} 
                onToggle={toggleTheme} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-slate-100 dark:bg-slate-900/50' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-800 text-amber-400 shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Dark High-Contrast</span>
                  {theme === 'dark' && <span className="text-[10px] font-mono text-amber-500 font-bold">ACTIVE</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deep slate background (#020617) optimized for long library circulation shifts.
                </p>
              </div>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Light High-Contrast</span>
                  {theme === 'light' && <span className="text-[10px] font-mono text-amber-600 font-bold">ACTIVE</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clean crisp paper white background (#F8FAFC) for brightly lit campus reading rooms.
                </p>
              </div>
            </button>

            {/* System OS Follow Card */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-sky-50/50 dark:bg-sky-950/30' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Follow System (OS)</span>
                  {theme === 'system' && <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">ACTIVE</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically syncs with Windows / macOS / Linux system dark or light appearance.
                </p>
              </div>
            </button>
          </div>

          {/* LIGHT THEME STYLE PICKER (5 SWATCH CARDS WITH LIVE PREVIEW) */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-[#1E293B] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Light theme style</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold">
                    Default: Blue-Gray
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Replaces harsh pure white in light mode with 5 curated campus reading room palettes. Select one to apply instantly with no reload.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Active: <strong className="text-slate-900 dark:text-slate-100 capitalize font-bold">{lightThemeStyle.replace('-', ' ')}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {LIGHT_THEME_OPTIONS.map((themeOption) => {
                const isSelected = lightThemeStyle === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => setLightThemeStyle(themeOption.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/30'
                    }`}
                  >
                    {/* Header with Title and Status Badges */}
                    <div className="flex items-center justify-between gap-1 mb-2.5 w-full">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {themeOption.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {themeOption.isDefault && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Default
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Small Live Preview (Page, Card, Text Sample) */}
                    <div 
                      data-swatch-preview="true"
                      className="w-full rounded-lg p-2.5 transition-transform group-hover:scale-[1.01] shadow-2xs border"
                      style={{ 
                        backgroundColor: themeOption.page,
                        borderColor: themeOption.border,
                      }}
                    >
                      {/* Live Card Sample */}
                      <div 
                        className="rounded-md p-2 shadow-2xs border"
                        style={{
                          backgroundColor: themeOption.card,
                          borderColor: themeOption.border,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span 
                            className="text-[11px] font-bold tracking-tight truncate leading-none"
                            style={{ color: themeOption.textPrimary }}
                          >
                            Catalog Card
                          </span>
                          <span 
                            className="text-[9px] font-semibold px-1 rounded"
                            style={{ 
                              backgroundColor: themeOption.raised,
                              color: themeOption.textSecondary 
                            }}
                          >
                            #01
                          </span>
                        </div>
                        <p 
                          className="text-[10px] leading-tight line-clamp-1 mb-2"
                          style={{ color: themeOption.textMuted }}
                        >
                          Book Title &amp; Author
                        </p>
                        {/* Mini button preview: #2563EB with white text */}
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[9px] font-medium"
                            style={{ color: themeOption.textSecondary }}
                          >
                            Available
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#2563EB] text-white shadow-2xs">
                            Loan
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer description & color swatches */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="truncate text-[10px]">{themeOption.description}</span>
                      <div className="flex items-center -space-x-1 shrink-0 ml-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: themeOption.page }} title={`Page: ${themeOption.page}`} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: themeOption.card }} title={`Card: ${themeOption.card}`} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: themeOption.border }} title={`Border: ${themeOption.border}`} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: themeOption.textPrimary }} title={`Text: ${themeOption.textPrimary}`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {onPlayBootAnimation && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-[#1E293B] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  App Opening Animation Ceremony
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Information */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-5 shadow-2xs transition-colors">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs transition-colors"
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
                <span className="font-bold text-slate-900 dark:text-white font-cinzel">
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
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-3">
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
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
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

          {/* Local SQLite Database & Maintenance */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Offline SQLite Data Management & Snapshot</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Database File URI
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.db_path}
                  className="w-full rounded-lg px-3 py-2 text-xs font-mono select-all border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#020617] text-slate-600 dark:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#020617]">
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Write-Ahead Logging (WAL)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">High concurrency write optimization</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40">
                  WAL ACTIVE
                </span>
              </div>
            </div>

            {onOpenStorageModal && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Database Storage Location &amp; Target Drive Directory</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    All catalog records, transactions, and student accounts are saved to this PC path.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenStorageModal}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Change Storage Location</span>
                </button>
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

              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Restore 8 titles & 42 copies?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
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
        </form>

      </div>
    </div>
  );
};
export default SettingsView;
