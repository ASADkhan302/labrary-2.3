/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { PrimaryHeader } from './components/PrimaryHeader';
import { BooksCatalogView } from './components/BooksCatalogView';
import { CirculationDeskView } from './components/CirculationDeskView';
import { BorrowersView } from './components/BorrowersView';
import { ReportsView } from './components/ReportsView';
import { BarcodeScannerView } from './components/BarcodeScannerView';
import { SqliteDataLayerView } from './components/SqliteDataLayerView';
import { CppNativeView } from './components/CppNativeView';
import { ExcelCenterView } from './components/ExcelCenterView';
import { SettingsView } from './components/SettingsView';
import { StateGalleryView } from './components/StateGalleryView';
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

import { Book, Borrower, BorrowerStatus, Transaction, HistoryEntry, SystemSettings, NavigationTab, StorageLocationConfig } from './types/library';
import { LibraryStorage } from './services/storage';
import { playSuccessBarcodeBeep, playClickSound, playErrorBeep } from './services/audio';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('catalog');
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

  // Database Storage Location State (Configurable on startup and anytime)
  const [storageConfig, setStorageConfig] = useState<StorageLocationConfig>(() => LibraryStorage.getStorageLocation());
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);

  // App opening animation state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAppEntered, setIsAppEntered] = useState<boolean>(false);

  // Sync document.title with institutional credentials
  useEffect(() => {
    if (settings.university_name) {
      document.title = `${settings.university_name} | ${settings.library_name || 'Library Management System'}`;
    }
  }, [settings.university_name, settings.library_name]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setIsAppEntered(true);
    const loc = LibraryStorage.getStorageLocation();
    if (!loc.isConfigured || loc.askOnStartup) {
      setIsStorageModalOpen(true);
    }
  }, []);

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
  const handleTabChange = useCallback((newTab: NavigationTab) => {
    if (newTab === activeTab) return;
    setIsNavigating(true);
    setIsScreenExiting(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsScreenExiting(false);
      setTimeout(() => {
        setIsNavigating(false);
      }, 200);
    }, 120);
  }, [activeTab]);

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

  // Count active loans
  const todayStr = new Date().toISOString().split('T')[0];
  const activeLoansCount = transactions.filter(t => t.status === 'ACTIVE' && t.due_date >= todayStr).length;
  const totalBooksCount = books.filter(b => b.is_active).length;
  const totalBorrowersCount = borrowers.filter(b => b.is_active).length;

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
      />

      {/* MAIN LAYOUT: SIDEBAR + WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
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
        <main 
          key={activeTab}
          className={`flex-1 flex flex-col overflow-hidden relative ${
            isScreenExiting ? 'screen-view-exit' : 'screen-view-enter'
          }`}
        >
        {activeTab === 'catalog' && (
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

        {activeTab === 'sqlite' && (
          <SqliteDataLayerView />
        )}

        {activeTab === 'cpp_native' && (
          <CppNativeView />
        )}

        {activeTab === 'excel' && (
          <ExcelCenterView
            books={books}
            borrowers={borrowers}
            transactions={transactions}
            history={history}
            onRefreshData={reloadData}
          />
        )}

        {activeTab === 'gallery' && (
          <StateGalleryView />
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
            onPlayBootAnimation={handleReplaySplash}
            onOpenStorageModal={() => setIsStorageModalOpen(true)}
          />
        )}
        </main>
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
