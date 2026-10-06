/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { PrimaryHeader } from './components/PrimaryHeader';
import { BooksCatalogView } from './components/BooksCatalogView';
import { CirculationDeskView } from './components/CirculationDeskView';
import { BorrowersView } from './components/BorrowersView';
import { ReportsView } from './components/ReportsView';
import { BarcodeScannerView } from './components/BarcodeScannerView';
import { ExcelCenterView } from './components/ExcelCenterView';
import { SettingsView } from './components/SettingsView';
import { LmsSidebar } from './components/LmsSidebar';
import { AppOpeningSplash } from './components/AppOpeningSplash';
import { ToastSuccessDeco } from './components/decorative/ToastSuccessDeco';

import { AddEditBookModal } from './components/modals/AddEditBookModal';
import { BookDetailsModal } from './components/modals/BookDetailsModal';
import { BorrowerDetailsModal } from './components/modals/BorrowerDetailsModal';
import { BarcodePrintModal } from './components/modals/BarcodePrintModal';
import { DeleteBookConfirmModal } from './components/modals/DeleteBookConfirmModal';
import { DeleteBorrowerConfirmModal } from './components/modals/DeleteBorrowerConfirmModal';
import { StorageLocationModal } from './components/modals/StorageLocationModal';
import { BookImportModal } from './components/modals/BookImportModal';
import { BatchLabelPrintModal } from './components/modals/BatchLabelPrintModal';
import { DataFilesDiffModal } from './components/modals/DataFilesDiffModal';
import { WelcomeLibraryModal } from './components/modals/WelcomeLibraryModal';

import { Book, Borrower, BorrowerStatus, Transaction, HistoryEntry, SystemSettings, NavigationTab, StorageLocationConfig } from './types/library';
import { LibraryStorage } from './services/storage';
import { SharedCountService } from './services/sharedCountService';
import { playSuccessBarcodeBeep, playClickSound, playErrorBeep } from './services/audio';
import { LibraryDataFilesService, ExternalChangesSummary } from './services/libraryDataFilesService';
import { BarcodeService } from './services/barcodeService';
import { BookSheetService } from './services/bookSheetService';
import { LibraryFolderService } from './services/libraryFolderService';

export default function App() {
  // Valid navigation tabs (developer screens removed)
  const VALID_TABS: NavigationTab[] = ['catalog', 'circulation', 'borrowers', 'reports', 'scanner', 'excel', 'settings'];

  // Navigation (if a removed screen was previously saved as last visited view, fallback to catalog)
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    try {
      const savedTab = localStorage.getItem('ulm_lms_last_tab') || localStorage.getItem('ulm_lms_active_view');
      if (savedTab && (savedTab === 'sqlite' || savedTab === 'cpp_native')) {
        localStorage.removeItem('ulm_lms_last_tab');
        localStorage.removeItem('ulm_lms_active_view');
        return 'catalog';
      }
      if (savedTab && ['catalog', 'circulation', 'borrowers', 'reports', 'scanner', 'excel', 'settings'].includes(savedTab)) {
        return savedTab as NavigationTab;
      }
    } catch {}
    return 'catalog';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Core Data
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(LibraryStorage.getSettings());

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [initialBarcodeForAdd, setInitialBarcodeForAdd] = useState('');
  
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBorrowerIdForDetails, setSelectedBorrowerIdForDetails] = useState<string | null>(null);
  const [bookForPrint, setBookForPrint] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [borrowerToDelete, setBorrowerToDelete] = useState<Borrower | null>(null);

  // Book Entry Sheet Import & Barcode Batch Print Modals
  const [isBookImportOpen, setIsBookImportOpen] = useState(false);
  const [isBatchLabelPrintOpen, setIsBatchLabelPrintOpen] = useState(false);
  const [batchPrintBookIds, setBatchPrintBookIds] = useState<string[]>([]);
  const [dataFileDiffSummary, setDataFileDiffSummary] = useState<ExternalChangesSummary | null>(null);
  const [isDataFileDiffOpen, setIsDataFileDiffOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isMissingLibrary, setIsMissingLibrary] = useState(false);
  const [missingLibraryPath, setMissingLibraryPath] = useState('');

  // Database Storage Location State (Configurable on startup and anytime)
  const [storageConfig, setStorageConfig] = useState<StorageLocationConfig>(() => LibraryStorage.getStorageLocation());
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [waitingSheetCount, setWaitingSheetCount] = useState<number>(0);

  // App opening animation state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAppEntered, setIsAppEntered] = useState<boolean>(false);

  // Initialize BookSheetService and monitor waiting items
  useEffect(() => {
    BookSheetService.init();
    const updateCount = () => {
      const q = BookSheetService.getQueue();
      setWaitingSheetCount(q.filter(i => i.status === 'waiting').length);
    };
    updateCount();
    const interval = setInterval(updateCount, 2500);

    // Auto-refresh data files on app close (beforeunload)
    const handleBeforeUnload = () => {
      LibraryFolderService.refreshDataFiles(true).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Sync document.title with institutional credentials
  useEffect(() => {
    if (settings.university_name) {
      document.title = `${settings.university_name} | ${settings.library_name || 'Library Management System'}`;
    }
  }, [settings.university_name, settings.library_name]);

  const handleSplashComplete = useCallback(async () => {
    setShowSplash(false);
    setIsAppEntered(true);

    const folderStatus = await LibraryFolderService.init();
    if (folderStatus.status === 'first_run') {
      setIsMissingLibrary(false);
      setIsWelcomeModalOpen(true);
    } else if (folderStatus.status === 'missing') {
      setIsMissingLibrary(true);
      setMissingLibraryPath(folderStatus.folderPath);
      setIsWelcomeModalOpen(true);
    } else {
      const loc = LibraryStorage.getStorageLocation();
      setStorageConfig(loc);
    }
  }, []);

  const handleRetrySheetSync = async () => {
    const res = await BookSheetService.processQueue();
    const q = BookSheetService.getQueue();
    setWaitingSheetCount(q.filter(i => i.status === 'waiting').length);
    showToast(res.message);
  };

  const handleStorageLocationSaved = (config: StorageLocationConfig) => {
    setStorageConfig(config);
    reloadData();
    showToast(`Storage repository mounted: ${config.folderPath}. Saved permanently for future app launches.`);
  };

  const handleReplaySplash = useCallback(() => {
    setShowSplash(true);
    setIsAppEntered(false);
  }, []);

  // Screen switch transition: outgoing screen fades out slightly (120ms), incoming screen enters with subtle 6px upward slide and fade (200ms)
  const [isScreenExiting, setIsScreenExiting] = useState(false);
  const handleTabChange = useCallback((newTab: NavigationTab | string) => {
    const targetTab: NavigationTab = VALID_TABS.includes(newTab as NavigationTab) ? (newTab as NavigationTab) : 'catalog';
    if (targetTab === activeTab) return;
    setIsNavigating(true);
    setIsScreenExiting(true);
    setTimeout(() => {
      setActiveTab(targetTab);
      setIsScreenExiting(false);
      setTimeout(() => {
        setIsNavigating(false);
      }, 200);
    }, 120);
  }, [activeTab, VALID_TABS]);

  // Status toast with slide in (200ms), pause on hover, slide out right (150ms)
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastRemainingRef = useRef<number>(3500);
  const toastStartRef = useRef<number>(0);
  const isToastHoveredRef = useRef(false);

  const dismissToast = useCallback(() => {
    setIsToastExiting(true);
    setTimeout(() => {
      setToastMessage(null);
      setIsToastExiting(false);
    }, 150);
  }, []);

  const showToast = useCallback((text: string, isError = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setIsToastExiting(false);
    setToastMessage({ text, isError });
    toastRemainingRef.current = 3500;
    toastStartRef.current = Date.now();
    isToastHoveredRef.current = false;

    toastTimeoutRef.current = setTimeout(() => {
      dismissToast();
    }, 3500);
  }, [dismissToast]);

  const handleToastMouseEnter = () => {
    isToastHoveredRef.current = true;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      const elapsed = Date.now() - toastStartRef.current;
      toastRemainingRef.current = Math.max(500, toastRemainingRef.current - elapsed);
    }
  };

  const handleToastMouseLeave = () => {
    isToastHoveredRef.current = false;
    toastStartRef.current = Date.now();
    toastTimeoutRef.current = setTimeout(() => {
      dismissToast();
    }, toastRemainingRef.current);
  };

  // Reload all data from local repository
  const reloadData = useCallback(() => {
    setBooks(LibraryStorage.getBooks());
    setBorrowers(LibraryStorage.getBorrowers());
    setTransactions(LibraryStorage.getTransactions());
    setHistory(LibraryStorage.getHistory());
    setSettings(LibraryStorage.getSettings());
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Global Keyboard shortcuts (e.g. Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleTabChange('catalog');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  // Dev-only automated WCAG AAA/AA Contrast Scanner (not shipped in the final production build)
  useEffect(() => {
    if (import.meta.env.DEV) {
      let isMounted = true;
      const timer = setTimeout(() => {
        import('./utils/contrastChecker').then(({ runContrastCheck }) => {
          if (isMounted) {
            runContrastCheck();
          }
        });
      }, 400);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [activeTab]);

  // Book CRUD actions
  const handleSaveBook = (bookData: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    const res = LibraryStorage.addBook(bookData);
    if (res.success) {
      reloadData();
      playSuccessBarcodeBeep();
      showToast(`Book "${bookData.book_name}" saved to SQLite database.`);
    }
    return res;
  };

  const handleUpdateBook = (id: string, updates: Partial<Book>) => {
    const res = LibraryStorage.updateBook(id, updates);
    if (res.success) {
      reloadData();
      playClickSound();
      showToast('Book record updated successfully.');
      if (selectedBookForDetails && selectedBookForDetails.id === id) {
        setSelectedBookForDetails(prev => prev ? { ...prev, ...updates } : null);
      }
    }
    return res;
  };

  const handleDeleteBookRequest = (book: Book) => {
    setBookToDelete(book);
  };

  const handleConfirmDeleteBook = (bookId: string, permanent: boolean) => {
    const res = LibraryStorage.deleteBook(bookId, permanent);
    if (res.success) {
      reloadData();
      playClickSound();
      showToast(res.message);
      if (selectedBookForDetails && selectedBookForDetails.id === bookId) {
        setSelectedBookForDetails(null);
      }
      if (bookToEdit && bookToEdit.id === bookId) {
        setIsAddEditOpen(false);
        setBookToEdit(null);
      }
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
  };

  // Borrower CRUD actions
  const handleAddBorrower = (borrowerData: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    const res = LibraryStorage.addBorrower(borrowerData);
    if (res.success) {
      reloadData();
      playClickSound();
      showToast(`Member "${borrowerData.name}" enrolled successfully.`);
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
    return res;
  };

  const handleUpdateBorrower = (id: string, updates: Partial<Borrower>) => {
    const res = LibraryStorage.updateBorrower(id, updates);
    if (res.success) {
      reloadData();
      playClickSound();
      showToast('Member profile updated successfully.');
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
    return res;
  };

  const handleBatchImportBorrowers = (borrowersList: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>[]) => {
    let imported = 0;
    const errors: string[] = [];
    borrowersList.forEach((b) => {
      const res = LibraryStorage.addBorrower(b);
      if (res.success) {
        imported++;
      } else {
        errors.push(`${b.university_id || b.name}: ${res.message}`);
      }
    });
    if (imported > 0) {
      reloadData();
      playSuccessBarcodeBeep();
      showToast(`Batch import complete: ${imported} members enrolled into database.`);
    }
    return { success: true, imported, errors };
  };

  const handleDeleteBorrowerRequest = (borrower: Borrower) => {
    setBorrowerToDelete(borrower);
  };

  const handleConfirmDeleteBorrower = (borrowerId: string, permanent: boolean) => {
    const res = LibraryStorage.deleteBorrower(borrowerId, permanent);
    if (res.success) {
      reloadData();
      playClickSound();
      showToast(res.message);
      if (selectedBorrowerIdForDetails === borrowerId) {
        setSelectedBorrowerIdForDetails(null);
      }
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
  };

  // Circulation Actions
  const handleIssueBook = (bookId: string, borrowerId: string, days: number) => {
    const res = LibraryStorage.issueBook(bookId, borrowerId, days);
    if (res.success) {
      reloadData();
      playSuccessBarcodeBeep();
      showToast(res.message);
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
    return res;
  };

  const handleReturnBook = (transactionId: string) => {
    const res = LibraryStorage.returnBook(transactionId);
    if (res.success) {
      reloadData();
      playSuccessBarcodeBeep();
      showToast(res.message);
    } else {
      playErrorBeep();
      showToast(res.message, true);
    }
    return res;
  };

  // Quick Export
  const handleQuickExport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const data = books.filter(b => b.is_active).map(b => ({
      Barcode: b.barcode,
      ISBN: b.isbn,
      Title: b.book_name,
      Author: b.author,
      Category: b.category,
      TotalCopies: b.total_quantity,
      AvailableCopies: b.available_quantity,
      Shelf: b.shelf,
      DeweyCallNumber: b.dewey_call_number,
    }));
    LibraryStorage.exportCsv(data, `ULM_LMS_Catalog_Export_${todayStr}.csv`);
    showToast('Catalog exported to CSV/Excel format.');
  };

  // Reset to Demo Data & First-Time Launch State
  const handleResetDemoData = () => {
    LibraryStorage.resetToFirstTimeOpen();
    reloadData();
    setShowSplash(true);
    setIsAppEntered(false);
  };

  const handleClearDemoData = () => {
    const res = LibraryStorage.clearDemoData();
    reloadData();
    playClickSound();
    showToast(res.message);
  };

  // Shared aggregate counts
  const sharedCounts = useMemo(() => {
    return SharedCountService.computeCounts(books, borrowers, transactions);
  }, [books, borrowers, transactions]);

  const activeLoansCount = sharedCounts.activeLoans;
  const totalBooksCount = sharedCounts.totalTitles;
  const totalBorrowersCount = sharedCounts.totalRegisteredBorrowers;

  const selectedBorrowerObj = selectedBorrowerIdForDetails 
    ? borrowers.find(b => b.id === selectedBorrowerIdForDetails) || null
    : null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative bg-[var(--background)] text-[var(--text-primary)]">
      {/* Thin 2px accent progress bar during screen changes and async operations */}
      {isNavigating && (
        <div className="top-route-progress" />
      )}

      {/* WINDOWS 11 TITLE BAR (Slides down on app entry) */}
      <div className={isAppEntered ? 'animate-slide-down' : ''}>
        <WindowsTitleBar
          stationId={settings.station_id}
          universityName={settings.university_name}
          libraryName={settings.library_name}
          onReplayOpeningAnimation={handleReplaySplash}
        />
      </div>

      {/* PRIMARY DESKTOP HEADER */}
      <PrimaryHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddBook={() => {
          setBookToEdit(null);
          setInitialBarcodeForAdd('');
          setIsAddEditOpen(true);
        }}
        onQuickExport={handleQuickExport}
        onReloadData={reloadData}
        onOpenStorageConfig={() => setIsStorageModalOpen(true)}
        storageLocationPath={storageConfig.folderPath}
        totalBooksCount={totalBooksCount}
        activeLoansCount={activeLoansCount}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSearch={() => setIsSearchOpen(true)}
        universityName={settings.university_name}
        libraryName={settings.library_name}
        waitingBooksCount={waitingSheetCount}
        onRetrySheetSync={handleRetrySheetSync}
      />

      {/* MAIN LAYOUT: SIDEBAR + WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Navigation Sidebar (Slides in from the left on app entry) */}
        <div className={`h-full ${isAppEntered ? 'animate-slide-right' : ''}`}>
          <LmsSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            totalBooksCount={totalBooksCount}
            activeLoansCount={activeLoansCount}
            totalBorrowersCount={totalBorrowersCount}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSearchOpen={isSearchOpen}
            onToggleSearch={setIsSearchOpen}
            catalogBooks={books}
            onSelectBook={(book) => setSelectedBookForDetails(book)}
            universityName={settings.university_name}
            libraryName={settings.library_name}
          />
        </div>

        {/* WORKSPACE VIEW (Screen switch: 120ms fade out, 200ms 6px upward slide and fade) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative overflow-hidden">
          {/* Static ULM Crest Watermark Layer */}
          <div className="watermark pointer-events-none" aria-hidden="true" />

          <main 
            key={activeTab}
            className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative overscroll-y-contain ${
              isScreenExiting ? 'screen-view-exit' : 'screen-view-enter'
            }`}
          >
        {(activeTab === 'catalog' || !['circulation', 'borrowers', 'reports', 'scanner', 'excel', 'settings'].includes(activeTab)) && (
          <BooksCatalogView
            books={books}
            transactions={transactions}
            onSelectBook={(book) => setSelectedBookForDetails(book)}
            onEditBook={(book) => {
              setBookToEdit(book);
              setIsAddEditOpen(true);
            }}
            onDeleteBook={handleDeleteBookRequest}
            onQuickLoan={(book) => {
              setActiveTab('circulation');
            }}
            onOpenAddBook={() => {
              setBookToEdit(null);
              setInitialBarcodeForAdd('');
              setIsAddEditOpen(true);
            }}
            onPrintBarcode={(book) => setBookForPrint(book)}
            onOpenImportBookEntrySheet={() => setIsBookImportOpen(true)}
            onOpenBatchLabelPrint={() => {
              setBatchPrintBookIds([]);
              setIsBatchLabelPrintOpen(true);
            }}
          />
        )}

        {activeTab === 'circulation' && (
          <CirculationDeskView
            transactions={transactions}
            books={books}
            borrowers={borrowers}
            onIssueBook={handleIssueBook}
            onReturnBook={handleReturnBook}
            onOpenBookDetails={(bookId) => {
              const b = books.find(item => item.id === bookId);
              if (b) setSelectedBookForDetails(b);
            }}
            onOpenBorrowerDetails={(borrowerId) => setSelectedBorrowerIdForDetails(borrowerId)}
          />
        )}

        {activeTab === 'borrowers' && (
          <BorrowersView
            borrowers={borrowers}
            transactions={transactions}
            onAddBorrower={handleAddBorrower}
            onUpdateBorrower={handleUpdateBorrower}
            onDeleteBorrower={handleDeleteBorrowerRequest}
            onOpenCirculationForBorrower={(borrowerId) => {
              setActiveTab('circulation');
            }}
            onReturnLoan={handleReturnBook}
            onOpenBookDetails={(bookId) => {
              const b = books.find(item => item.id === bookId);
              if (b) setSelectedBookForDetails(b);
            }}
            onBatchImportBorrowers={handleBatchImportBorrowers}
            onReloadData={reloadData}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            books={books}
            borrowers={borrowers}
            transactions={transactions}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === 'scanner' && (
          <BarcodeScannerView
            books={books}
            transactions={transactions}
            onOpenAddBookWithBarcode={(barcode) => {
              setBookToEdit(null);
              setInitialBarcodeForAdd(barcode);
              setIsAddEditOpen(true);
            }}
            onOpenBookDetails={(bookId) => {
              const b = books.find(item => item.id === bookId);
              if (b) setSelectedBookForDetails(b);
            }}
            onQuickLoan={() => {
              setActiveTab('circulation');
            }}
            onQuickReturn={handleReturnBook}
            onPrintBarcode={(book) => setBookForPrint(book)}
          />
        )}

        {activeTab === 'excel' && (
          <ExcelCenterView
            books={books}
            borrowers={borrowers}
            transactions={transactions}
            history={history}
            onRefreshData={reloadData}
            onOpenImportEntrySheet={() => setIsBookImportOpen(true)}
            onOpenTransferZipModal={() => setIsWelcomeModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              showToast('System configuration saved.');
            }}
            onResetDemoData={handleResetDemoData}
            onClearDemoData={handleClearDemoData}
            onResetToZeroComplete={() => {
              reloadData();
              showToast('Library reset to zero. Pre-reset backup saved.');
            }}
            onPlayBootAnimation={handleReplaySplash}
            onOpenStorageModal={() => setIsStorageModalOpen(true)}
            onOpenWelcomeModal={() => setIsWelcomeModalOpen(true)}
          />
        )}
        </main>
        </div>
      </div>

      {/* MODALS */}
      {/* Add / Edit Book Modal */}
      <AddEditBookModal
        isOpen={isAddEditOpen}
        bookToEdit={bookToEdit}
        initialBarcode={initialBarcodeForAdd}
        onClose={() => {
          setIsAddEditOpen(false);
          setBookToEdit(null);
          setInitialBarcodeForAdd('');
        }}
        onSave={handleSaveBook}
        onUpdate={handleUpdateBook}
        onDelete={(book) => {
          setIsAddEditOpen(false);
          handleDeleteBookRequest(book);
        }}
      />

      {/* Book Details Specification Modal */}
      <BookDetailsModal
        book={selectedBookForDetails}
        transactions={transactions}
        isOpen={!!selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onEdit={(book) => {
          setSelectedBookForDetails(null);
          setBookToEdit(book);
          setIsAddEditOpen(true);
        }}
        onLoan={() => {
          setSelectedBookForDetails(null);
          setActiveTab('circulation');
        }}
        onPrintBarcode={(book) => setBookForPrint(book)}
        onReturnLoan={handleReturnBook}
        onDelete={(book) => {
          setSelectedBookForDetails(null);
          handleDeleteBookRequest(book);
        }}
      />

      {/* Delete Book Confirmation Modal */}
      <DeleteBookConfirmModal
        book={bookToDelete}
        transactions={transactions}
        isOpen={!!bookToDelete}
        onClose={() => setBookToDelete(null)}
        onConfirmDelete={handleConfirmDeleteBook}
      />

      {/* Borrower Details & History Modal */}
      <BorrowerDetailsModal
        borrower={selectedBorrowerObj}
        transactions={transactions}
        isOpen={!!selectedBorrowerIdForDetails}
        onClose={() => setSelectedBorrowerIdForDetails(null)}
        onReturnLoan={handleReturnBook}
        onOpenBookDetails={(bookId) => {
          const b = books.find(item => item.id === bookId);
          if (b) setSelectedBookForDetails(b);
        }}
        onIssueBook={(b) => {
          setSelectedBorrowerIdForDetails(null);
          setActiveTab('circulation');
        }}
        onToggleStatus={(b) => {
          const newStatus: BorrowerStatus = b.status === 'active' ? 'suspended' : 'active';
          handleUpdateBorrower(b.id, { status: newStatus, is_active: newStatus === 'active' });
        }}
      />

      {/* Delete Borrower Confirmation Modal */}
      <DeleteBorrowerConfirmModal
        borrower={borrowerToDelete}
        transactions={transactions}
        isOpen={!!borrowerToDelete}
        onClose={() => setBorrowerToDelete(null)}
        onConfirmDelete={handleConfirmDeleteBorrower}
      />

      {/* Barcode Label Print Preview Modal */}
      <BarcodePrintModal
        book={bookForPrint}
        isOpen={!!bookForPrint}
        onClose={() => setBookForPrint(null)}
      />

      {/* Database Storage Location Configuration Modal */}
      <StorageLocationModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onLocationSaved={handleStorageLocationSaved}
      />

      {/* Book Entry Sheet Import Engine Modal */}
      <BookImportModal
        isOpen={isBookImportOpen}
        onClose={() => setIsBookImportOpen(false)}
        onImportComplete={(batchId, count, bookIds) => {
          reloadData();
          setIsBookImportOpen(false);
          showToast(`Successfully imported ${count} books from entry sheet.`);
          if (bookIds && bookIds.length > 0) {
            setBatchPrintBookIds(bookIds);
            setIsBatchLabelPrintOpen(true);
          }
        }}
        onOpenLabelBatchPrint={(bookIds) => {
          setBatchPrintBookIds(bookIds);
          setIsBatchLabelPrintOpen(true);
        }}
      />

      {/* Batch Thermal Barcode Label Print Modal */}
      <BatchLabelPrintModal
        isOpen={isBatchLabelPrintOpen}
        bookIds={batchPrintBookIds.length > 0 ? batchPrintBookIds : undefined}
        books={batchPrintBookIds.length === 0 ? books.filter(b => b.is_active) : undefined}
        onClose={() => {
          setIsBatchLabelPrintOpen(false);
          setBatchPrintBookIds([]);
        }}
      />

      {/* External Library Data Files Diff Modal */}
      <DataFilesDiffModal
        isOpen={isDataFileDiffOpen}
        summary={dataFileDiffSummary}
        onImportChanges={(applyDeletions, preferredSource) => {
          reloadData();
          setIsDataFileDiffOpen(false);
          setDataFileDiffSummary(null);
          showToast('External changes incorporated into local catalog.');
        }}
        onIgnoreAndRewrite={() => {
          LibraryDataFilesService.writeLibraryDataFiles().then(() => {
            setIsDataFileDiffOpen(false);
            setDataFileDiffSummary(null);
            showToast('Rewrote data files with active library catalog.');
          });
        }}
        onClose={() => {
          setIsDataFileDiffOpen(false);
          setDataFileDiffSummary(null);
        }}
      />

      {/* First-Time Welcome & Start Screen Modal */}
      <WelcomeLibraryModal
        isOpen={isWelcomeModalOpen}
        isMissingPath={isMissingLibrary}
        missingPath={missingLibraryPath}
        onClose={() => {
          setIsWelcomeModalOpen(false);
          setIsMissingLibrary(false);
        }}
        onComplete={(msg) => {
          reloadData();
          showToast(msg);
        }}
      />

      {/* Floating System Toast with Countdown Bar (Slide in from bottom right 200ms, pause on hover, slide out right 150ms) */}
      {toastMessage && (
        <div 
          onMouseEnter={handleToastMouseEnter}
          onMouseLeave={handleToastMouseLeave}
          className={`fixed bottom-6 right-6 z-50 overflow-hidden rounded-[8px] border border-[var(--border)] shadow-[var(--shadow-modal)] bg-[var(--card)] toast-container ${
            isToastExiting ? 'toast-exit' : ''
          }`}
        >
          <div className="px-4 py-3 text-[14px] flex items-center gap-3">
            {toastMessage.isError ? (
              <span className="w-2 h-2 rounded-full shrink-0 bg-rose-500" />
            ) : (
              <ToastSuccessDeco />
            )}
            <span className="text-[var(--text-primary)] font-medium">{toastMessage.text}</span>
          </div>
          {/* Thin auto-dismiss countdown bar */}
          <div className="h-[2px] w-full bg-[var(--border)]">
            <div className={`h-full toast-countdown-bar ${toastMessage.isError ? 'bg-rose-500' : 'bg-[#2563EB]'}`} />
          </div>
        </div>
      )}

      {/* App Opening / Boot Animation Ceremony */}
      {showSplash && (
        <AppOpeningSplash onComplete={handleSplashComplete} />
      )}

    </div>
  );
}
