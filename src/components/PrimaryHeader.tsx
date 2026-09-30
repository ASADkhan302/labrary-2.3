import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  BookOpen, 
  PanelLeftClose, 
  PanelLeftOpen, 
  QrCode, 
  RotateCw, 
  HardDrive 
} from 'lucide-react';
import { NavigationTab } from '../types/library';
import { useTheme } from '../context/ThemeContext';

interface PrimaryHeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenAddBook: () => void;
  onQuickExport: () => void;
  onReloadData?: () => void;
  onOpenStorageConfig?: () => void;
  storageLocationPath?: string;
  totalBooksCount?: number;
  activeLoansCount?: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
  universityName?: string;
  libraryName?: string;
}

export const PrimaryHeader: React.FC<PrimaryHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAddBook,
  onQuickExport,
  onReloadData,
  onOpenStorageConfig,
  storageLocationPath,
  isSidebarCollapsed = false,
  onToggleSidebar,
  universityName = 'University of Lakki Marwat',
  libraryName = 'Campus Catalog & Circulation',
}) => {
  const { isDark } = useTheme();
  const [isRotating, setIsRotating] = useState(false);

  const handleRefreshClick = () => {
    setIsRotating(true);
    if (onReloadData) onReloadData();
    setTimeout(() => setIsRotating(false), 600);
  };

  return (
    <header className="w-full transition-colors duration-150 border-b shrink-0 z-40 select-none border-[var(--border)] bg-[var(--background)]">
      {/* Main Top Header Bar */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Toggle + Institutional Insignia + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
              className="btn-icon"
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[var(--text-accent)]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
          )}

          {/* Insignia Shield */}
          <div 
            className="w-8 h-8 rounded-[8px] bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0"
            title="University of Lakki Marwat Official Insignia"
          >
            <BookOpen className="w-4 h-4 text-[var(--text-accent)] stroke-[2]" />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className="font-cinzel font-semibold text-[16px] sm:text-[18px] tracking-wide uppercase truncate leading-tight text-[var(--text-primary)]">
              {universityName}
            </span>
            <span className="text-[12px] font-medium text-[var(--text-muted)] tracking-normal truncate leading-none mt-0.5">
              {libraryName}
            </span>
          </div>
        </div>

        {/* Right Section: Core Utility Actions */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Quick Barcode Station Launcher */}
          {activeTab !== 'scanner' && activeTab !== 'catalog' && (
            <button
              onClick={() => onTabChange('scanner')}
              className="btn-secondary h-8 px-3 text-[12px] hidden lg:inline-flex"
              title="Barcode Scanner Station (⌘2)"
            >
              <QrCode className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              <span>Barcode Station</span>
            </button>
          )}

          {/* Database Storage Location Configuration */}
          {onOpenStorageConfig && (
            <button
              onClick={onOpenStorageConfig}
              className="btn-secondary h-8 px-3 text-[12px]"
              title={`Database Storage Directory: ${storageLocationPath || 'C:\\ULM_Library_Database'}. Click to configure storage location.`}
            >
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-accent)]" />
              <span className="hidden md:inline font-mono text-[12px] truncate max-w-[120px]">
                {storageLocationPath ? storageLocationPath.split('\\').pop() : 'Storage'}
              </span>
            </button>
          )}

          {/* Synchronize / Refresh Database Store */}
          {onReloadData && (
            <button
              onClick={handleRefreshClick}
              className="btn-secondary h-8 px-3 text-[12px]"
              title="Synchronize UI with Database / Reload"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[var(--text-accent)] ${isRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          )}

          {/* Export Center Trigger */}
          <button
            onClick={onQuickExport}
            className="btn-secondary h-8 px-3 text-[12px]"
            title="Export Catalog & Transactions to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Primary Action: Add Book */}
          <button
            onClick={onOpenAddBook}
            className="btn-primary h-8 px-3 text-[12px]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Book</span>
          </button>
        </div>
      </div>
    </header>
  );
};
