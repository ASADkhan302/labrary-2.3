import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  ArrowRightLeft, 
  Users, 
  BarChart3, 
  QrCode, 
  Database, 
  Cpu, 
  FileSpreadsheet, 
  Settings, 
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
  GraduationCap
} from 'lucide-react';
import { NavigationTab, Book } from '../types/library';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export type LmsNavItemData = {
  id: NavigationTab | 'search';
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: LmsNavItemData[];
};

export type LmsNavGroupData = {
  heading?: string;
  items: LmsNavItemData[];
};

interface LmsSidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  totalBooksCount: number;
  activeLoansCount: number;
  totalBorrowersCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSearchOpen?: boolean;
  onToggleSearch?: (open: boolean) => void;
  catalogBooks?: Book[];
  onSelectBook?: (book: Book) => void;
  universityName?: string;
  libraryName?: string;
}

export function LmsSidebar({
  activeTab,
  onTabChange,
  totalBooksCount,
  activeLoansCount,
  totalBorrowersCount,
  isCollapsed,
  onToggleCollapse,
  isSearchOpen: externalIsSearchOpen,
  onToggleSearch,
  catalogBooks = [],
  onSelectBook,
  universityName = 'University of Lakki Marwat',
  libraryName = 'Central Campus Library',
}: LmsSidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [selectedCampus, setSelectedCampus] = useState('Central Campus LMS');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [internalIsSearchOpen, setInternalIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSearchOpen = externalIsSearchOpen !== undefined ? externalIsSearchOpen : internalIsSearchOpen;
  const setIsSearchOpen = (open: boolean) => {
    if (onToggleSearch) {
      onToggleSearch(open);
    } else {
      setInternalIsSearchOpen(open);
    }
  };

  // Keyboard shortcut listener for Command+K / Ctrl+K and ⌘1-⌘6, ⌘,, ⌘B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
        return;
      }

      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !isInputFocused) {
        e.preventDefault();
        onToggleCollapse();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !isInputFocused) {
        if (e.key === '1') { e.preventDefault(); onTabChange('catalog'); }
        else if (e.key === '2') { e.preventDefault(); onTabChange('scanner'); }
        else if (e.key === '3') { e.preventDefault(); onTabChange('circulation'); }
        else if (e.key === '4') { e.preventDefault(); onTabChange('borrowers'); }
        else if (e.key === '5') { e.preventDefault(); onTabChange('reports'); }
        else if (e.key === '6') { e.preventDefault(); onTabChange('excel'); }
        else if (e.key === ',') { e.preventDefault(); onTabChange('settings'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onTabChange, onToggleCollapse]);

  const navGroups: LmsNavGroupData[] = [
    {
      items: [
        { id: 'search', title: 'Quick Search', icon: Search, shortcut: '⌘K' },
        { 
          id: 'catalog', 
          title: 'Books Catalog', 
          icon: BookOpen, 
          badge: totalBooksCount,
          shortcut: '⌘1'
        },
        { 
          id: 'scanner', 
          title: 'Barcode Station', 
          icon: QrCode,
          shortcut: '⌘2'
        },
      ]
    },
    {
      heading: 'Circulation & Desk',
      items: [
        { 
          id: 'circulation', 
          title: 'Circulation Desk', 
          icon: ArrowRightLeft, 
          badge: activeLoansCount > 0 ? activeLoansCount : undefined,
          shortcut: '⌘3'
        },
        { 
          id: 'borrowers', 
          title: 'Borrowers & Faculty', 
          icon: Users, 
          badge: totalBorrowersCount,
          shortcut: '⌘4'
        },
      ]
    },
    {
      heading: 'Analytics & Data',
      items: [
        { id: 'reports', title: 'Reports & Audits', icon: BarChart3, shortcut: '⌘5' },
        { id: 'excel', title: 'Excel & PC Migration', icon: FileSpreadsheet, shortcut: '⌘6' },
      ]
    },
    {
      heading: 'System Engine',
      items: [
        { id: 'sqlite', title: 'SQLite Native Layer', icon: Database },
        { id: 'cpp_native', title: 'C++ Scanner Engine', icon: Cpu },
      ]
    }
  ];

  const bottomItems: LmsNavItemData[] = [
    { id: 'settings', title: 'System Settings', icon: Settings, shortcut: '⌘,' },
  ];

  const handleItemClick = (id: NavigationTab | 'search') => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    onTabChange(id as NavigationTab);
  };

  const campuses = [
    'Central Campus LMS',
    'Main Library (Block A)',
    'Engineering & Tech Wing',
    'Postgraduate Research Unit'
  ];

  return (
    <>
      <aside 
        className={`h-full flex flex-col shrink-0 transition-all duration-150 ease-out select-none z-30 relative border-r border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] ${isCollapsed ? 'w-[68px]' : 'w-[260px]'}`}
      >
        {/* Top Header / Campus Switcher */}
        <div className="p-3 border-b border-[var(--border)] relative">
          <div 
            onClick={() => !isCollapsed && setIsWorkspaceOpen(!isWorkspaceOpen)}
            className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/[0.04] ${isCollapsed ? 'justify-center p-1' : ''}`}
            title={selectedCampus}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-[8px] bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="w-4 h-4 stroke-[2.2]" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-semibold leading-tight truncate text-[var(--text-primary)]">
                    {libraryName || selectedCampus}
                  </span>
                  <span className="text-[12px] text-[var(--text-accent)] font-mono leading-none mt-1 uppercase font-semibold truncate">
                    {universityName || 'Univ. Lakki Marwat'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] transition-colors shrink-0 ml-1.5" />
            )}
          </div>

          {/* Workspace dropdown */}
          {isWorkspaceOpen && !isCollapsed && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceOpen(false)} />
              <div className="absolute top-[60px] left-3 right-3 rounded-[12px] shadow-lg z-50 p-2 flex flex-col gap-1 border border-[var(--border)] bg-[var(--card)]">
                <div className="px-3 py-1 text-[12px] uppercase font-semibold text-[var(--text-muted)]">
                  Select Campus Unit
                </div>
                {campuses.map(campus => (
                  <button
                    key={campus}
                    onClick={() => {
                      setSelectedCampus(campus);
                      setIsWorkspaceOpen(false);
                    }}
                    className={`h-9 px-3 text-left text-[14px] rounded-[8px] transition-colors duration-150 ${
                      selectedCampus === campus
                        ? 'bg-blue-500/10 text-[var(--text-accent)] font-semibold border border-blue-500/30'
                        : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {campus}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-1">
              {group.heading && !isCollapsed && (
                <span className="px-3 mb-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group.heading}
                </span>
              )}
              {isCollapsed && group.heading && (
                <div className="h-[1px] my-1 mx-2 bg-[var(--border)]" />
              )}
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed ? item.title : undefined}
                    className={`group relative flex items-center justify-between px-3 h-10 rounded-[8px] cursor-pointer transition-all duration-150 text-left w-full border text-[14px] ${
                      isActive
                        ? 'bg-blue-500/10 text-[var(--text-accent)] font-semibold border-blue-500/30'
                        : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <div className="relative flex items-center gap-3 min-w-0">
                      <Icon 
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive 
                            ? 'text-[var(--text-accent)]' 
                            : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                        }`} 
                        strokeWidth={isActive ? 2 : 1.75} 
                      />
                      {!isCollapsed && (
                        <span className="truncate">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="relative flex items-center gap-2 ml-2">
                        {item.shortcut && (
                          <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[12px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.03]">
                            {item.shortcut}
                          </kbd>
                        )}
                        {item.badge !== undefined && (
                          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[12px] font-medium rounded-full ${
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-black/5 dark:bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border)]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom items & Collapse Toggle */}
        <div className="p-3 border-t border-[var(--border)] flex flex-col gap-2">
          {bottomItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.title : undefined}
                className={`group relative flex items-center justify-between px-3 h-10 rounded-[8px] cursor-pointer transition-all duration-150 w-full border text-[14px] ${
                  isActive
                    ? 'bg-blue-500/10 text-[var(--text-accent)] font-semibold border-blue-500/30' 
                    : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="relative flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--text-accent)]' : 'text-[var(--text-muted)]'}`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </div>
                {!isCollapsed && item.shortcut && (
                  <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[12px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.03]">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}

          {/* Theme Quick Toggle */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 h-10 rounded-[8px] border border-[var(--border)] bg-black/5 dark:bg-white/[0.02]">
              <span className="text-[12px] font-medium text-[var(--text-muted)]">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} className="scale-90 origin-right" />
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} className="scale-75" />
            </div>
          )}

          {/* Collapse/Expand Sidebar Toggle */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="flex items-center justify-center h-10 rounded-[8px] transition-colors duration-150 w-full border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.04]"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[var(--text-accent)]" />
            ) : (
              <div className="flex items-center justify-between w-full px-2 text-[12px] font-medium">
                <span>Collapse Sidebar</span>
                <PanelLeftClose className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Global Quick Search Modal (Command+K) */}
      {isSearchOpen && (
        <div className="modal-backdrop">
          <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl rounded-[16px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-modal)] overflow-hidden z-50">
            <div className="flex items-center px-4 h-12 border-b border-[var(--border)]">
              <Search className="w-4 h-4 text-[var(--text-accent)] mr-3 shrink-0" strokeWidth={2} />
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none! shadow-none! p-0! h-auto! outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Type to search catalog books, borrowers, or commands..."
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[12px]"
                >
                  Clear
                </button>
              )}
              <kbd 
                onClick={() => setIsSearchOpen(false)}
                className="inline-flex items-center justify-center h-5 px-1.5 text-[12px] font-mono rounded cursor-pointer border border-[var(--border)] text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.04]"
              >
                ESC
              </kbd>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="ml-3 btn-icon text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions List in Search */}
            <div className="p-3 max-h-[60vh] overflow-y-auto flex flex-col gap-1">
              {(() => {
                const q = searchQuery.toLowerCase().trim();
                const allNav = navGroups.flatMap(g => g.items).filter(item => item.id !== 'search');
                const matchingNav = !q ? allNav : allNav.filter(item => item.title.toLowerCase().includes(q));
                const matchingBooks = !q ? [] : catalogBooks.filter(b => 
                  b.book_name.toLowerCase().includes(q) || 
                  b.barcode.toLowerCase().includes(q) ||
                  b.author.toLowerCase().includes(q) ||
                  b.category.toLowerCase().includes(q)
                ).slice(0, 6);

                return (
                  <>
                    <div className="text-[12px] uppercase font-semibold px-2 py-1 text-[var(--text-muted)]">
                      Quick Navigation
                    </div>
                    {matchingNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id as NavigationTab);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors text-[14px] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-[var(--text-accent)]" />
                            <span>{item.title}</span>
                          </div>
                          {item.shortcut && (
                            <kbd className="text-[12px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.04]">
                              {item.shortcut}
                            </kbd>
                          )}
                        </div>
                      );
                    })}

                    {matchingBooks.length > 0 && (
                      <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
                        <div className="text-[12px] uppercase font-semibold text-[var(--text-accent)] px-2 py-0.5">
                          Catalog Books ({matchingBooks.length})
                        </div>
                        {matchingBooks.map(book => (
                          <div
                            key={book.id}
                            onClick={() => {
                              if (onSelectBook) {
                                onSelectBook(book);
                              } else {
                                onTabChange('catalog');
                              }
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-all border border-transparent hover:border-blue-500/30 text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.04]"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-[14px] font-semibold truncate">
                                {book.book_name}
                              </div>
                              <div className="text-[12px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                                <span>{book.author}</span>
                                <span>•</span>
                                <span className="font-mono text-[12px] text-[var(--text-accent)] font-semibold">{book.barcode}</span>
                                <span>•</span>
                                <span className="text-[12px]">{book.category}</span>
                              </div>
                            </div>
                            <span className="shrink-0 text-[12px] font-mono px-2 py-0.5 rounded-[8px] border border-[var(--border)] bg-black/5 dark:bg-white/[0.04] text-[var(--text-primary)]">
                              {book.available_quantity}/{book.total_quantity} Avail
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchingNav.length === 0 && matchingBooks.length === 0 && (
                      <div className="py-8 text-center text-[var(--text-muted)] text-[14px]">
                        No matches found for <span className="text-[var(--text-accent)] font-mono">"{searchQuery}"</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="px-4 h-10 border-t border-[var(--border)] flex items-center justify-between text-[12px] text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                <span>Tip: Press <strong>⌘1</strong> - <strong>⌘6</strong> for instant tab switches</span>
              </div>
              <span className="font-mono text-[12px]">ULM LMS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
