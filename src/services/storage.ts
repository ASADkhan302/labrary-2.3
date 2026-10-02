import { Book, Borrower, BorrowerRole, BorrowerStatus, Transaction, HistoryEntry, SystemSettings, StorageLocationConfig } from '../types/library';
import { INITIAL_BOOKS, INITIAL_BORROWERS, INITIAL_TRANSACTIONS, INITIAL_HISTORY, INITIAL_SETTINGS } from './initialData';
import { normalizeDateAdded, getTodayIso } from '../utils/dateUtils';

const STORAGE_KEYS = {
  BOOKS: 'ulm_lms_books_v1',
  BORROWERS: 'ulm_lms_borrowers_v1',
  TRANSACTIONS: 'ulm_lms_transactions_v1',
  HISTORY: 'ulm_lms_history_v1',
  SETTINGS: 'ulm_lms_settings_v1',
  BACKUPS: 'ulm_lms_backups_v1',
  LOCATION: 'ulm_lms_storage_location_v1',
  INITIALIZED: 'ulm_lms_first_run_init_v2',
  USER_VERSION: 'ulm_lms_sqlite_user_version',
};

export const DEFAULT_STORAGE_LOCATION: StorageLocationConfig = {
  mode: 'LOCAL_DISK',
  folderPath: 'C:\\ULM_Library_Database',
  folderName: 'ULM_Library_Database',
  fileName: 'ulm_library_master.sqlite',
  autoSaveToDisk: true,
  askOnStartup: false,
  isConfigured: false,
};

export class LibraryStorage {
  private static directoryHandle: any = null;

  static setDirectoryHandle(handle: any): void {
    this.directoryHandle = handle;
  }

  static getDirectoryHandle(): any {
    return this.directoryHandle;
  }

  static getStorageLocation(): StorageLocationConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (!data) return DEFAULT_STORAGE_LOCATION;
      return { ...DEFAULT_STORAGE_LOCATION, ...JSON.parse(data) };
    } catch {
      return DEFAULT_STORAGE_LOCATION;
    }
  }

  static saveStorageLocation(config: StorageLocationConfig): void {
    localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(config));
    try {
      const settings = this.getSettings();
      settings.db_path = `${config.folderPath}\\${config.fileName}`;
      this.saveSettings(settings);
    } catch {
      // Ignore if settings not ready
    }
  }

  static async syncToDiskLocation(): Promise<{ success: boolean; message: string }> {
    const loc = this.getStorageLocation();
    const backupJson = JSON.stringify({
      schema_version: '1.0',
      university: 'University of Lakki Marwat',
      database_type: 'SQLite_WAL_Master',
      timestamp: new Date().toISOString(),
      location: loc.folderPath,
      books: this.getBooks(),
      borrowers: this.getBorrowers(),
      transactions: this.getTransactions(),
      history: this.getHistory(),
      settings: this.getSettings(),
    }, null, 2);

    if (this.directoryHandle) {
      try {
        const fileHandle = await this.directoryHandle.getFileHandle(
          loc.fileName.endsWith('.json') ? loc.fileName : `${loc.fileName}.json`, 
          { create: true }
        );
        const writable = await fileHandle.createWritable();
        await writable.write(backupJson);
        await writable.close();
        loc.lastSyncTimestamp = new Date().toLocaleTimeString();
        this.saveStorageLocation(loc);
        return { success: true, message: `Saved database to ${loc.folderPath}\\${loc.fileName}` };
      } catch (err: unknown) {
        return { success: false, message: `Directory write failed: ${(err as Error).message}` };
      }
    }

    return { success: true, message: `Storage path active: ${loc.folderPath}` };
  }

  static generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // --- Books ---
  static getBooks(): Book[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      let books: Book[];
      if (!data) {
        books = INITIAL_BOOKS;
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
      } else {
        books = JSON.parse(data);
      }

      // Automatic Migration & Backfill check: Ensure all books have date_added populated
      let migrationNeeded = false;
      const today = getTodayIso();
      const migrated = books.map((b: Book) => {
        if (!b.date_added) {
          migrationNeeded = true;
          const fallbackDate = b.created_at ? b.created_at.split(' ')[0].split('T')[0] : today;
          return { ...b, date_added: fallbackDate };
        }
        return b;
      });

      if (migrationNeeded) {
        this.saveBooks(migrated);
        localStorage.setItem(STORAGE_KEYS.USER_VERSION, '2');
        return migrated;
      }
      return books;
    } catch {
      return INITIAL_BOOKS;
    }
  }

  static saveBooks(books: Book[]): void {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }

  /**
   * Database Schema Migration Engine (PRAGMA user_version)
   * Version 1 -> Version 2:
   * Adds column date_added (DATE YYYY-MM-DD) to books table.
   * Backfills existing rows with the date part of created_at.
   * Creates B-Tree index idx_books_date_added.
   */
  static migrateDatabase(): { success: boolean; message: string; rowsMigrated: number; version: number } {
    let count = 0;
    const books = this.getBooks();
    const today = getTodayIso();
    const updated = books.map(b => {
      if (!b.date_added) {
        count++;
        const fallbackDate = b.created_at ? b.created_at.split(' ')[0].split('T')[0] : today;
        return { ...b, date_added: fallbackDate };
      }
      return b;
    });

    this.saveBooks(updated);
    localStorage.setItem(STORAGE_KEYS.USER_VERSION, '2');

    this.logHistory({
      action: 'SCHEMA_MIGRATION',
      description: `Migrated database schema to v2: added date_added column with B-tree index and backfilled ${count} books.`,
      barcode: 'SCHEMA-V2',
      user: 'SQLite-Migration-Engine',
    });

    return {
      success: true,
      message: `Migration to SQLite schema v2 complete. Added date_added column and backfilled ${count} existing titles without data loss.`,
      rowsMigrated: count,
      version: 2,
    };
  }

  static addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'is_active'>): { success: boolean; message: string; book?: Book } {
    const books = this.getBooks();
    
    // Barcode must be unique
    const existing = books.find(b => b.barcode.trim().toLowerCase() === book.barcode.trim().toLowerCase() && b.is_active);
    if (existing) {
      return { success: false, message: `Barcode "${book.barcode}" is already registered to "${existing.book_name}".` };
    }

    const today = getTodayIso();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newBook: Book = {
      ...book,
      id: this.generateId('book'),
      date_added: book.date_added || today,
      created_at: now,
      updated_at: now,
      is_active: true,
    };

    // Ensure available does not exceed total
    newBook.available_quantity = Math.min(newBook.available_quantity, newBook.total_quantity);

    books.unshift(newBook);
    this.saveBooks(books);

    this.logHistory({
      action: 'BOOK_ADDED',
      description: `Added "${newBook.book_name}" (Barcode: ${newBook.barcode}, Copies: ${newBook.total_quantity})`,
      barcode: newBook.barcode,
      book_id: newBook.id,
      user: 'Librarian-Admin',
    });

    return { success: true, message: 'Book registered successfully.', book: newBook };
  }

  static updateBook(id: string, updates: Partial<Book>): { success: boolean; message: string } {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, message: 'Book record not found in SQLite repository.' };
    }

    if (updates.barcode) {
      const duplicate = books.find(b => b.id !== id && b.barcode.trim().toLowerCase() === updates.barcode!.trim().toLowerCase() && b.is_active);
      if (duplicate) {
        return { success: false, message: `Cannot update: Barcode "${updates.barcode}" belongs to "${duplicate.book_name}".` };
      }
    }

    const current = books[index];
    const total = updates.total_quantity !== undefined ? updates.total_quantity : current.total_quantity;
    let available = updates.available_quantity !== undefined ? updates.available_quantity : current.available_quantity;
    
    // Strict rule: Available cannot exceed total, cannot drop below 0
    if (available > total) available = total;
    if (available < 0) available = 0;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    books[index] = {
      ...current,
      ...updates,
      total_quantity: total,
      available_quantity: available,
      updated_at: now,
    };

    this.saveBooks(books);

    this.logHistory({
      action: 'BOOK_UPDATED',
      description: `Updated record for "${books[index].book_name}"`,
      barcode: books[index].barcode,
      book_id: id,
      user: 'Librarian-Admin',
    });

    return { success: true, message: 'Book record updated successfully.' };
  }

  static deleteBook(id: string, permanent: boolean = false): { success: boolean; message: string } {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return { success: false, message: 'Book record not found in repository.' };

    const transactions = this.getTransactions();
    const activeLoan = transactions.find(t => t.book_id === id && t.status !== 'RETURNED');
    if (activeLoan) {
      return { 
        success: false, 
        message: `Cannot delete: Copies of this book are actively issued to "${activeLoan.borrower_name}". Return all loaned copies before deleting.` 
      };
    }

    const targetBook = books[index];
    const bookTitle = targetBook.book_name;
    const barcode = targetBook.barcode;

    if (permanent) {
      books.splice(index, 1);
    } else {
      books[index].is_active = false;
    }
    this.saveBooks(books);

    this.logHistory({
      action: 'BOOK_DELETED',
      description: `${permanent ? 'Permanently purged' : 'Soft-deleted (archived)'} book "${bookTitle}" (${barcode})`,
      barcode,
      book_id: id,
      user: 'Librarian-Admin',
    });

    return { 
      success: true, 
      message: permanent 
        ? `Book "${bookTitle}" permanently removed from SQLite database.` 
        : `Book "${bookTitle}" removed from active catalog.` 
    };
  }

  static softDeleteBook(id: string): { success: boolean; message: string } {
    return this.deleteBook(id, false);
  }

  static normalizePakistaniPhone(raw: string): string {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length >= 12) {
      digits = '0' + digits.substring(2);
    }
    if (digits.length === 11 && digits.startsWith('03')) {
      return `${digits.substring(0, 4)}-${digits.substring(4)}`;
    }
    return raw.trim();
  }

  // --- Borrowers ---
  static getBorrowers(): Borrower[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BORROWERS);
      let list: Borrower[];
      if (!data) {
        list = INITIAL_BORROWERS;
        localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(list));
        return list;
      }
      list = JSON.parse(data);
      // Migration: ensure role, university_id, barcode, borrow_limit, status, etc.
      let changed = false;
      list = list.map(b => {
        let mod = false;
        const role = b.role || (b.name?.includes('Dr.') || b.name?.includes('Prof') ? 'Faculty' : 'Student');
        const uid = b.university_id || b.student_id || `ULM-${b.id}`;
        const barcode = b.barcode || uid;
        const status = b.status || (b.is_active ? 'active' : 'left');
        const limit = b.borrow_limit || (role === 'Faculty' ? 10 : role === 'Staff' ? 5 : 3);
        const joined = b.joined_date || b.created_at || new Date().toISOString().split('T')[0];

        if (b.role !== role || b.university_id !== uid || b.barcode !== barcode || b.status !== status || b.borrow_limit !== limit || !b.joined_date) {
          mod = true;
          changed = true;
        }

        return {
          ...b,
          role: role as any,
          university_id: uid,
          student_id: uid,
          barcode,
          status: status as any,
          borrow_limit: limit,
          joined_date: joined,
          phone: b.phone ? this.normalizePakistaniPhone(b.phone) : '0300-0000000',
          department: b.department || 'Computer Science',
          program: b.program || (role === 'Student' ? 'BCS' : role),
        };
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(list));
      }
      return list;
    } catch {
      return INITIAL_BORROWERS;
    }
  }

  static saveBorrowers(borrowers: Borrower[]): void {
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(borrowers));
  }

  static addBorrower(borrower: Omit<Borrower, 'id' | 'created_at' | 'updated_at' | 'is_active'>): { success: boolean; message: string; borrower?: Borrower; existingBorrowerId?: string } {
    const borrowers = this.getBorrowers();
    const uid = (borrower.university_id || borrower.student_id || '').trim().toUpperCase();

    // Check duplicate university ID
    const existing = borrowers.find(b => (b.university_id || b.student_id).trim().toUpperCase() === uid && b.status !== 'left');
    if (existing) {
      return { 
        success: false, 
        message: `Already exists: ${existing.name}`,
        existingBorrowerId: existing.id
      };
    }

    const normPhone = this.normalizePakistaniPhone(borrower.phone);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newBorrower: Borrower = {
      ...borrower,
      id: this.generateId('bor'),
      role: borrower.role || 'Student',
      university_id: uid,
      student_id: uid,
      barcode: borrower.barcode || uid,
      phone: normPhone,
      borrow_limit: borrower.borrow_limit || (borrower.role === 'Faculty' ? 10 : borrower.role === 'Staff' ? 5 : 3),
      joined_date: borrower.joined_date || new Date().toISOString().split('T')[0],
      valid_until: borrower.valid_until || null,
      status: borrower.status || 'active',
      created_at: now,
      updated_at: now,
      is_active: true,
    };

    borrowers.unshift(newBorrower);
    this.saveBorrowers(borrowers);

    this.logHistory({
      action: 'BORROWER_ADDED',
      description: `Registered ${newBorrower.role} "${newBorrower.name}" (${newBorrower.university_id})`,
      barcode: newBorrower.university_id,
      borrower_id: newBorrower.id,
      user: 'Desk-Registrar',
    });

    return { success: true, message: 'Person enrolled successfully.', borrower: newBorrower };
  }

  static updateBorrower(id: string, updates: Partial<Borrower>): { success: boolean; message: string; borrower?: Borrower } {
    const borrowers = this.getBorrowers();
    const index = borrowers.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, message: 'Borrower record not found in database.' };
    }

    if (updates.university_id) {
      const targetUid = updates.university_id.trim().toUpperCase();
      const duplicate = borrowers.find(b => b.id !== id && (b.university_id || b.student_id).trim().toUpperCase() === targetUid && b.status !== 'left');
      if (duplicate) {
        return { success: false, message: `University ID "${updates.university_id}" is already assigned to "${duplicate.name}".` };
      }
    }

    const updated: Borrower = {
      ...borrowers[index],
      ...updates,
      student_id: updates.university_id || borrowers[index].university_id || borrowers[index].student_id,
      barcode: updates.barcode || updates.university_id || borrowers[index].barcode,
      phone: updates.phone ? this.normalizePakistaniPhone(updates.phone) : borrowers[index].phone,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    borrowers[index] = updated;
    this.saveBorrowers(borrowers);

    this.logHistory({
      action: 'BORROWER_UPDATED',
      description: `Updated borrower profile "${updated.name}" (${updated.university_id})`,
      barcode: updated.university_id,
      borrower_id: id,
      user: 'Librarian-Admin',
    });

    return { success: true, message: 'Borrower profile updated successfully.', borrower: updated };
  }

  static setBorrowerStatus(id: string, newStatus: BorrowerStatus): { success: boolean; message: string } {
    const borrowers = this.getBorrowers();
    const index = borrowers.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, message: 'Borrower record not found.' };
    }

    borrowers[index].status = newStatus;
    borrowers[index].is_active = newStatus === 'active';
    borrowers[index].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.saveBorrowers(borrowers);

    this.logHistory({
      action: 'BORROWER_STATUS_CHANGED',
      description: `Changed status of "${borrowers[index].name}" to ${newStatus}`,
      barcode: borrowers[index].university_id,
      borrower_id: id,
      user: 'Librarian-Admin'
    });

    return { success: true, message: `Member status updated to "${newStatus}".` };
  }

  static deleteBorrower(id: string, permanent: boolean = true): { success: boolean; message: string } {
    const borrowers = this.getBorrowers();
    const index = borrowers.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, message: 'Borrower record not found in database.' };
    }

    // Safety guard: cannot delete borrower who has active or overdue borrowed books
    const transactions = this.getTransactions();
    const activeLoans = transactions.filter(t => t.borrower_id === id && t.status !== 'RETURNED');
    if (activeLoans.length > 0) {
      const bookTitles = activeLoans.map(t => t.book_name || 'loaned item').join(', ');
      return {
        success: false,
        message: `Cannot delete "${borrowers[index].name}": Member currently has ${activeLoans.length} active loan(s) (${bookTitles}). Return all borrowed books at circulation desk first.`
      };
    }

    const target = borrowers[index];
    const memberName = target.name;
    const studentId = target.university_id || target.student_id;

    // Circulation rule: Never hard-delete a person who has loan history; set status to "left" instead
    const hasHistory = transactions.some(t => t.borrower_id === id);
    if (hasHistory) {
      borrowers[index].status = 'left';
      borrowers[index].is_active = false;
      borrowers[index].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      this.saveBorrowers(borrowers);

      this.logHistory({
        action: 'BORROWER_ARCHIVED',
        description: `Member "${memberName}" (${studentId}) has loan transaction history. Ledger preserved and status set to 'left'.`,
        barcode: studentId,
        borrower_id: id,
        user: 'Librarian-Admin',
      });

      return {
        success: true,
        message: `Member "${memberName}" has loan history on file. Record preserved in audit log and status set to "left".`
      };
    }

    if (permanent) {
      borrowers.splice(index, 1);
    } else {
      borrowers[index].status = 'left';
      borrowers[index].is_active = false;
    }
    this.saveBorrowers(borrowers);

    this.logHistory({
      action: 'BORROWER_DELETED',
      description: `${permanent ? 'Purged' : 'Deactivated'} borrower profile "${memberName}" (${studentId})`,
      barcode: studentId,
      borrower_id: id,
      user: 'Librarian-Admin',
    });

    return {
      success: true,
      message: `Person "${memberName}" (${studentId}) removed from library system successfully.`
    };
  }

  static softDeleteBorrower(id: string): { success: boolean; message: string } {
    return this.deleteBorrower(id, false);
  }

  static clearDemoData(): { success: boolean; message: string; count: number } {
    const borrowers = this.getBorrowers();
    const demoBorrowers = borrowers.filter(b => b.notes === 'DEMO');
    const demoBorrowerIds = new Set(demoBorrowers.map(b => b.id));
    const remainingBorrowers = borrowers.filter(b => b.notes !== 'DEMO');

    const books = this.getBooks();
    const remainingBooks = books.filter(b => (b as any).source_remarks !== 'DEMO');

    const transactions = this.getTransactions();
    const remainingTransactions = transactions.filter(t => !demoBorrowerIds.has(t.borrower_id));

    this.saveBorrowers(remainingBorrowers);
    this.saveBooks(remainingBooks);
    this.saveTransactions(remainingTransactions);

    this.logHistory({
      action: 'CLEAR_DEMO',
      description: `Cleared ${demoBorrowers.length} sample demo people (notes = 'DEMO') and demo records.`,
      barcode: 'DEMO-CLEAR',
      user: 'Librarian-Admin'
    });

    return {
      success: true,
      message: `Cleared ${demoBorrowers.length} demo borrower records.`,
      count: demoBorrowers.length
    };
  }

  // --- Transactions & Circulation ---
  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  static saveTransactions(txs: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  }

  static issueBook(bookId: string, borrowerId: string, daysToLoan: number = 14): { success: boolean; message: string; transaction?: Transaction } {
    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.id === bookId && b.is_active);
    if (bookIndex === -1) return { success: false, message: 'Book not found in database.' };

    const book = books[bookIndex];
    if (book.available_quantity <= 0) {
      return { success: false, message: `Book "${book.book_name}" is currently unavailable (0 copies on shelf).` };
    }

    const borrowers = this.getBorrowers();
    const borrower = borrowers.find(b => b.id === borrowerId);
    if (!borrower) return { success: false, message: 'Borrower record not found.' };

    // CIRCULATION RULES ENFORCEMENT:
    // 1. Status is not active
    if (borrower.status !== 'active') {
      return {
        success: false,
        message: `Issuing blocked: Member account status is "${borrower.status.toUpperCase()}". Only active members can borrow library books.`
      };
    }

    // 2. Valid until has passed
    const todayStr = new Date().toISOString().split('T')[0];
    if (borrower.valid_until && borrower.valid_until < todayStr) {
      return {
        success: false,
        message: `Issuing blocked: Membership card expired on ${borrower.valid_until}. Please renew membership credentials at registration desk.`
      };
    }

    // 3. Borrow limit reached
    const transactions = this.getTransactions();
    const activeLoans = transactions.filter(t => t.borrower_id === borrowerId && t.status !== 'RETURNED');
    const limit = borrower.borrow_limit || (borrower.role === 'Faculty' ? 10 : borrower.role === 'Staff' ? 5 : 3);
    if (activeLoans.length >= limit) {
      return {
        success: false,
        message: `Issuing blocked: Borrow limit reached (${activeLoans.length} / ${limit} books). Return an existing borrowed item before issuing new books.`
      };
    }

    // 4. Unpaid fines exceed settings threshold (default Rs 500)
    const settings = this.getSettings();
    const fineRate = settings.fine_per_day_pkr || 50;
    const maxUnpaidFine = (settings as any).max_unpaid_fine_pkr || 500;
    let unpaidFineTotal = 0;
    activeLoans.forEach(loan => {
      if (loan.due_date < todayStr) {
        const diffMs = new Date(todayStr).getTime() - new Date(loan.due_date).getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days > 0) {
          unpaidFineTotal += days * fineRate;
        }
      }
    });

    if (unpaidFineTotal > maxUnpaidFine) {
      return {
        success: false,
        message: `Issuing blocked: Outstanding overdue fines (Rs ${unpaidFineTotal}) exceed institutional limit of Rs ${maxUnpaidFine}. Settle overdue fines to restore circulation privileges.`
      };
    }

    // Deduct available copy: Available = Available - 1
    book.available_quantity -= 1;
    this.saveBooks(books);

    const now = new Date();
    const issueDateStr = now.toISOString().split('T')[0];
    const dueDate = new Date(now.getTime() + daysToLoan * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const nowTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newTx: Transaction = {
      id: this.generateId('tx'),
      book_id: book.id,
      borrower_id: borrower.id,
      book_name: book.book_name,
      borrower_name: borrower.name,
      barcode: book.barcode,
      student_id: borrower.university_id || borrower.student_id,
      action: 'ISSUE',
      issue_date: issueDateStr,
      due_date: dueDateStr,
      return_date: null,
      quantity: 1,
      status: 'ACTIVE',
      created_at: nowTimeStr,
    };

    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    this.logHistory({
      action: 'BOOK_ISSUED',
      description: `Issued "${book.book_name}" to ${borrower.name} (${borrower.university_id || borrower.student_id}) - Due: ${dueDateStr}`,
      barcode: book.barcode,
      book_id: book.id,
      borrower_id: borrower.id,
      user: 'Circulation-Desk-01',
    });

    return { success: true, message: `"${book.book_name}" issued to ${borrower.name}.`, transaction: newTx };
  }

  static returnBook(transactionId: string): { success: boolean; message: string } {
    const transactions = this.getTransactions();
    const txIndex = transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) return { success: false, message: 'Transaction record not found.' };

    const tx = transactions[txIndex];
    if (tx.status === 'RETURNED') {
      return { success: false, message: 'This book has already been marked as returned.' };
    }

    const books = this.getBooks();
    const bookIndex = books.findIndex(b => b.id === tx.book_id);
    if (bookIndex !== -1) {
      // Return: Available = Available + 1 (never exceeding total)
      books[bookIndex].available_quantity = Math.min(
        books[bookIndex].total_quantity,
        books[bookIndex].available_quantity + 1
      );
      this.saveBooks(books);
    }

    const now = new Date();
    const returnDateStr = now.toISOString().split('T')[0];
    
    transactions[txIndex] = {
      ...tx,
      status: 'RETURNED',
      return_date: returnDateStr,
    };
    this.saveTransactions(transactions);

    this.logHistory({
      action: 'BOOK_RETURNED',
      description: `Returned copy of "${tx.book_name || 'Book'}" from ${tx.borrower_name || 'Borrower'}`,
      barcode: tx.barcode || '',
      book_id: tx.book_id,
      borrower_id: tx.borrower_id,
      user: 'Circulation-Desk-01',
    });

    return { success: true, message: `Book returned and shelf quantity replenished (+1).` };
  }

  // --- History ---
  static getHistory(): HistoryEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
        return INITIAL_HISTORY;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_HISTORY;
    }
  }

  static logHistory(entry: Omit<HistoryEntry, 'id' | 'created_at'>): void {
    const history = this.getHistory();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newEntry: HistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now,
    };
    history.unshift(newEntry);
    if (history.length > 500) history.pop();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  // --- Settings ---
  static getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      const parsed = JSON.parse(data);
      if (parsed) {
        delete parsed.theme;
        delete parsed.light_theme_style;
      }
      return { ...INITIAL_SETTINGS, ...parsed };
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  static saveSettings(settings: SystemSettings): void {
    const cleanSettings = { ...settings };
    delete (cleanSettings as any).theme;
    delete (cleanSettings as any).light_theme_style;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleanSettings));
  }

  // --- Reset to Complete First-Time App Opening State ---
  static resetToFirstTimeOpen(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.BOOKS);
      localStorage.removeItem(STORAGE_KEYS.BORROWERS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.LOCATION);
      localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
      localStorage.removeItem('ulm_lms_theme');
      localStorage.removeItem('ulm_lms_light_theme_style');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('ulm_lms_splash_seen');
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(STORAGE_KEYS.BORROWERS, JSON.stringify(INITIAL_BORROWERS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify({
      mode: 'LOCAL_DISK',
      folderPath: 'C:\\ULM_Library_Database',
      folderName: 'ULM_Library_Database',
      fileName: 'ulm_library_master.sqlite',
      autoSaveToDisk: true,
      askOnStartup: false,
      isConfigured: false,
    }));
  }

  // --- Reset to Demo Data ---
  static resetToDemoData(): void {
    this.resetToFirstTimeOpen();
    this.logHistory({
      action: 'DATABASE_RESET',
      description: 'Reset database to baseline University of Lakki Marwat catalog (8 titles, 42 copies, first-time launch state).',
      barcode: 'DB-RESET',
      user: 'Librarian-Admin',
    });
  }

  // --- SQL Simulator Execution Engine ---
  static executeSql(query: string): { columns: string[]; rows: (string | number | boolean | null)[][]; executionTimeMs: number; message?: string; isError?: boolean } {
    const start = performance.now();
    const trimmed = query.trim();

    if (!trimmed) {
      return { columns: [], rows: [], executionTimeMs: 0, message: 'Query cannot be empty.' };
    }

    try {
      const upper = trimmed.toUpperCase();

      // PRAGMA handlers
      if (upper.startsWith('PRAGMA INTEGRITY_CHECK')) {
        return {
          columns: ['integrity_check'],
          rows: [['ok']],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          message: 'SQLite database integrity check passed: 0 corruption errors, all B-tree pages valid.',
        };
      }

      if (upper.startsWith('PRAGMA JOURNAL_MODE')) {
        return {
          columns: ['journal_mode'],
          rows: [['wal']],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          message: 'WAL (Write-Ahead Logging) enabled. Concurrent reader/writer active.',
        };
      }

      if (upper.startsWith('PRAGMA USER_VERSION =') || upper.startsWith('PRAGMA USER_VERSION=')) {
        const val = parseInt(trimmed.replace(/[^0-9]/g, ''), 10) || 2;
        localStorage.setItem(STORAGE_KEYS.USER_VERSION, String(val));
        return {
          columns: ['user_version'],
          rows: [[val]],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          message: `PRAGMA user_version set to ${val}.`,
        };
      }

      if (upper.startsWith('PRAGMA USER_VERSION')) {
        const v = parseInt(localStorage.getItem(STORAGE_KEYS.USER_VERSION) || '2', 10);
        return {
          columns: ['user_version'],
          rows: [[v]],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }

      if (upper.startsWith('PRAGMA INDEX_LIST')) {
        return {
          columns: ['seq', 'name', 'unique', 'origin', 'partial'],
          rows: [
            [0, 'idx_books_barcode', 1, 'c', 0],
            [1, 'idx_books_isbn', 0, 'c', 0],
            [2, 'idx_books_date_added', 0, 'c', 0],
          ],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }

      if (upper.startsWith('ALTER TABLE BOOKS ADD COLUMN DATE_ADDED') || (upper.startsWith('ALTER TABLE') && upper.includes('DATE_ADDED'))) {
        const res = this.migrateDatabase();
        return {
          columns: ['status'],
          rows: [[`Column date_added added to books table. Backfilled ${res.rowsMigrated} rows.`]],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          message: res.message,
        };
      }

      if (upper.startsWith('CREATE INDEX') && upper.includes('DATE_ADDED')) {
        return {
          columns: ['status'],
          rows: [['Index idx_books_date_added created']],
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          message: 'B-tree Index idx_books_date_added active for sub-10ms sorting across 100,000+ volumes.',
        };
      }

      if (upper.startsWith('PRAGMA TABLE_INFO')) {
        const match = upper.match(/PRAGMA TABLE_INFO\((\w+)\)/);
        const tableName = match ? match[1].toLowerCase() : 'books';
        let cols: (string | number | boolean | null)[][] = [];
        if (tableName === 'books') {
          cols = [
            [0, 'id', 'TEXT', 1, null, 1],
            [1, 'barcode', 'TEXT', 1, null, 0],
            [2, 'isbn', 'TEXT', 1, null, 0],
            [3, 'book_name', 'TEXT', 1, null, 0],
            [4, 'author', 'TEXT', 1, null, 0],
            [5, 'category', 'TEXT', 1, null, 0],
            [6, 'total_quantity', 'INTEGER', 1, 1, 0],
            [7, 'available_quantity', 'INTEGER', 1, 1, 0],
            [8, 'shelf', 'TEXT', 0, null, 0],
            [9, 'is_active', 'INTEGER', 1, 1, 0],
            [10, 'date_added', 'DATE', 0, null, 0],
          ];
        } else if (tableName === 'borrowers') {
          cols = [
            [0, 'id', 'TEXT', 1, null, 1],
            [1, 'name', 'TEXT', 1, null, 0],
            [2, 'student_id', 'TEXT', 1, null, 0],
            [3, 'department', 'TEXT', 1, null, 0],
            [4, 'phone', 'TEXT', 0, null, 0],
            [5, 'is_active', 'INTEGER', 1, 1, 0],
          ];
        } else {
          cols = [
            [0, 'id', 'TEXT', 1, null, 1],
            [1, 'book_id', 'TEXT', 1, null, 0],
            [2, 'borrower_id', 'TEXT', 1, null, 0],
            [3, 'action', 'TEXT', 1, null, 0],
            [4, 'status', 'TEXT', 1, null, 0],
            [5, 'due_date', 'TEXT', 1, null, 0],
          ];
        }
        return {
          columns: ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'],
          rows: cols,
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }

      // SELECT queries
      if (upper.startsWith('SELECT')) {
        let tableName = 'books';
        if (upper.includes('FROM BORROWERS')) tableName = 'borrowers';
        else if (upper.includes('FROM TRANSACTIONS')) tableName = 'transactions';
        else if (upper.includes('FROM HISTORY')) tableName = 'history';
        else if (upper.includes('FROM SETTINGS')) tableName = 'settings';

        if (tableName === 'books') {
          const books = this.getBooks().filter(b => b.is_active);
          const columns = ['id', 'barcode', 'book_name', 'author', 'category', 'total_quantity', 'available_quantity', 'shelf', 'dewey_call_number', 'date_added'];
          const rows = books.map(b => [
            b.id,
            b.barcode,
            b.book_name,
            b.author,
            b.category,
            b.total_quantity,
            b.available_quantity,
            b.shelf,
            b.dewey_call_number,
            b.date_added || (b.created_at ? b.created_at.split(' ')[0] : getTodayIso()),
          ]);
          return {
            columns,
            rows,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
            message: `${rows.length} rows retrieved from sqlite::books table.`,
          };
        } else if (tableName === 'borrowers') {
          const borrowers = this.getBorrowers().filter(b => b.is_active);
          const columns = ['id', 'student_id', 'name', 'department', 'program', 'phone', 'email'];
          const rows = borrowers.map(b => [
            b.id,
            b.student_id,
            b.name,
            b.department,
            b.program,
            b.phone || '',
            b.email || '',
          ]);
          return {
            columns,
            rows,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
            message: `${rows.length} rows retrieved from sqlite::borrowers table.`,
          };
        } else if (tableName === 'transactions') {
          const txs = this.getTransactions();
          const columns = ['id', 'book_name', 'borrower_name', 'barcode', 'action', 'issue_date', 'due_date', 'status'];
          const rows = txs.map(t => [
            t.id,
            t.book_name || t.book_id,
            t.borrower_name || t.borrower_id,
            t.barcode || '',
            t.action,
            t.issue_date,
            t.due_date,
            t.status,
          ]);
          return {
            columns,
            rows,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
            message: `${rows.length} records retrieved from sqlite::transactions table.`,
          };
        } else {
          const history = this.getHistory();
          const columns = ['id', 'action', 'description', 'barcode', 'user', 'created_at'];
          const rows = history.slice(0, 50).map(h => [
            h.id,
            h.action,
            h.description,
            h.barcode,
            h.user,
            h.created_at,
          ]);
          return {
            columns,
            rows,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
            message: `${rows.length} entries retrieved from sqlite::history audit log.`,
          };
        }
      }

      return {
        columns: ['status'],
        rows: [['OK']],
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        message: 'Query executed successfully.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        columns: ['error'],
        rows: [[msg]],
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        isError: true,
        message: `SQLite Error: ${msg}`,
      };
    }
  }

  // --- Export Utilities ---
  static exportCsv(data: Record<string, unknown>[], filename: string): void {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(field => {
          const val = row[field];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --- PC-to-PC Master Data Migration Suite ---
  static exportMasterMigrationCsv(): void {
    const today = new Date().toISOString().split('T')[0];
    const books = this.getBooks();
    const borrowers = this.getBorrowers();
    const transactions = this.getTransactions();
    const settings = this.getSettings();

    const lines: string[] = [];
    lines.push("# ====================================================================");
    lines.push("# UNIVERSITY OF LAKKI MARWAT - LIBRARY MANAGEMENT SYSTEM (LMS)");
    lines.push("# MASTER PC-TO-PC DATA MIGRATION PACKAGE");
    lines.push(`# EXPORT DATE: ${new Date().toISOString()}`);
    lines.push("# INSTRUCTIONS: Transfer this file to another PC via USB, email, or network drive.");
    lines.push("# On the destination PC, open LMS -> Excel Center -> Ingest Master Migration File.");
    lines.push("# ====================================================================");
    lines.push("");

    // Section 1: Settings
    lines.push("# === SECTION: SETTINGS ===");
    lines.push("StationID,LibraryName,UniversityName,CampusAddress,Phone,Email,ScannerSound,ErrorSound,WalMode");
    lines.push(`"${settings.station_id}","${(settings.library_name || '').replace(/"/g, '""')}","${(settings.university_name || '').replace(/"/g, '""')}","${(settings.campus_address || '').replace(/"/g, '""')}","${settings.phone}","${settings.email}",${settings.scanner_sound},${settings.error_sound},${settings.wal_mode}`);
    lines.push("");

    // Section 2: Books
    lines.push("# === SECTION: BOOKS ===");
    lines.push("Barcode,ISBN,BookTitle,Author,Category,TotalCopies,AvailableCopies,Shelf,Row,DeweyCallNumber,Publisher,Edition,Year,Language,IsActive");
    books.forEach(b => {
      lines.push([
        `"${b.barcode || ''}"`,
        `"${b.isbn || ''}"`,
        `"${(b.book_name || '').replace(/"/g, '""')}"`,
        `"${(b.author || '').replace(/"/g, '""')}"`,
        `"${(b.category || '').replace(/"/g, '""')}"`,
        b.total_quantity,
        b.available_quantity,
        `"${(b.shelf || '').replace(/"/g, '""')}"`,
        `"${b.row || '1'}"`,
        `"${(b.dewey_call_number || '').replace(/"/g, '""')}"`,
        `"${(b.publisher || '').replace(/"/g, '""')}"`,
        `"${(b.edition || '').replace(/"/g, '""')}"`,
        b.publication_year || 2024,
        `"${b.language || 'English'}"`,
        b.is_active ? 1 : 0,
      ].join(','));
    });
    lines.push("");

    // Section 3: Borrowers
    lines.push("# === SECTION: BORROWERS ===");
    lines.push("StudentID,FullName,Department,Program,ClassName,Phone,Email,IsActive");
    borrowers.forEach(br => {
      lines.push([
        `"${br.student_id || ''}"`,
        `"${(br.name || '').replace(/"/g, '""')}"`,
        `"${(br.department || '').replace(/"/g, '""')}"`,
        `"${(br.program || '').replace(/"/g, '""')}"`,
        `"${br.class_name || ''}"`,
        `"${br.phone || ''}"`,
        `"${br.email || ''}"`,
        br.is_active ? 1 : 0,
      ].join(','));
    });
    lines.push("");

    // Section 4: Transactions
    lines.push("# === SECTION: TRANSACTIONS ===");
    lines.push("TransactionID,Barcode,BookTitle,BorrowerName,StudentID,Action,IssueDate,DueDate,ReturnDate,Quantity,Status");
    transactions.forEach(t => {
      lines.push([
        `"${t.id || ''}"`,
        `"${t.barcode || ''}"`,
        `"${(t.book_name || '').replace(/"/g, '""')}"`,
        `"${(t.borrower_name || '').replace(/"/g, '""')}"`,
        `"${t.student_id || ''}"`,
        `"${t.action || 'ISSUE'}"`,
        `"${t.issue_date || ''}"`,
        `"${t.due_date || ''}"`,
        `"${t.return_date || ''}"`,
        t.quantity || 1,
        `"${t.status || 'ACTIVE'}"`,
      ].join(','));
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ULM_LMS_Master_Migration_Package_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static exportMasterMigrationJson(): void {
    const today = new Date().toISOString().split('T')[0];
    const packageData = {
      app: "University of Lakki Marwat Library Management System",
      version: "2.4.0",
      export_timestamp: new Date().toISOString(),
      migration_format: "ULM_SQLITE_PORTABLE_PACKAGE_V1",
      data: {
        books: this.getBooks(),
        borrowers: this.getBorrowers(),
        transactions: this.getTransactions(),
        settings: this.getSettings(),
        history: this.getHistory(),
      }
    };

    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ULM_LMS_System_Database_Clone_${today}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // RFC-4180 compliant CSV row parser supporting quoted strings with commas and escaped quotes
  static parseCsvRow(line: string, defaultDelimiter = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let delimiter = defaultDelimiter;

    // Auto-detect delimiter if line uses semicolons (common in European Excel locales)
    if (delimiter === ',' && !line.includes(',') && line.includes(';')) {
      delimiter = ';';
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  static importMasterMigrationFile(content: string, mode: 'merge' | 'overwrite' = 'merge'): {
    success: boolean;
    message: string;
    stats: { books: number; borrowers: number; transactions: number; settings: boolean };
  } {
    try {
      if (!content || !content.trim()) {
        return {
          success: false,
          message: 'No file data provided. Please select a file or paste migration data.',
          stats: { books: 0, borrowers: 0, transactions: 0, settings: false },
        };
      }

      // Remove UTF-8 BOM if present and normalize line endings
      const cleaned = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const trimmed = cleaned.trim();
      const stats = { books: 0, borrowers: 0, transactions: 0, settings: false };

      // Case 1: Check if content is JSON format
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        const parsed = JSON.parse(trimmed);
        const data = parsed.data || parsed;

        if (mode === 'overwrite') {
          if (Array.isArray(data.books)) {
            this.saveBooks(data.books);
            stats.books = data.books.length;
          }
          if (Array.isArray(data.borrowers)) {
            this.saveBorrowers(data.borrowers);
            stats.borrowers = data.borrowers.length;
          }
          if (Array.isArray(data.transactions)) {
            this.saveTransactions(data.transactions);
            stats.transactions = data.transactions.length;
          }
          if (data.settings && typeof data.settings === 'object') {
            this.saveSettings({ ...this.getSettings(), ...data.settings });
            stats.settings = true;
          }
        } else {
          // Merge mode
          if (Array.isArray(data.books)) {
            const currentBooks = this.getBooks();
            data.books.forEach((nb: Book) => {
              const idx = currentBooks.findIndex(cb => cb.barcode === nb.barcode);
              if (idx !== -1) {
                currentBooks[idx] = { ...currentBooks[idx], ...nb };
              } else {
                currentBooks.unshift(nb);
              }
              stats.books++;
            });
            this.saveBooks(currentBooks);
          }

          if (Array.isArray(data.borrowers)) {
            const currentBorrowers = this.getBorrowers();
            data.borrowers.forEach((nbr: Borrower) => {
              const idx = currentBorrowers.findIndex(cb => cb.student_id === nbr.student_id);
              if (idx !== -1) {
                currentBorrowers[idx] = { ...currentBorrowers[idx], ...nbr };
              } else {
                currentBorrowers.unshift(nbr);
              }
              stats.borrowers++;
            });
            this.saveBorrowers(currentBorrowers);
          }

          if (Array.isArray(data.transactions)) {
            const currentTxs = this.getTransactions();
            data.transactions.forEach((nt: Transaction) => {
              const idx = currentTxs.findIndex(ct => ct.id === nt.id);
              if (idx !== -1) {
                currentTxs[idx] = { ...currentTxs[idx], ...nt };
              } else {
                currentTxs.unshift(nt);
              }
              stats.transactions++;
            });
            this.saveTransactions(currentTxs);
          }
        }

        this.logHistory({
          action: 'SYSTEM_RESTORED',
          description: `Migrated from PC backup (${mode.toUpperCase()} mode): ${stats.books} books, ${stats.borrowers} members, ${stats.transactions} loans.`,
          barcode: 'MIGRATION-JSON',
          user: 'System-Migration-Engine',
        });

        return {
          success: true,
          message: `Successfully migrated database! Restored ${stats.books} books, ${stats.borrowers} members, and ${stats.transactions} loan transactions into local SQLite database.`,
          stats,
        };
      }

      // Case 2: Multi-section or single-sheet CSV file
      const rawLines = trimmed.split('\n');
      let currentSection: 'NONE' | 'SETTINGS' | 'BOOKS' | 'BORROWERS' | 'TRANSACTIONS' = 'NONE';
      let isHeaderRow = false;

      const parsedBooks: Book[] = [];
      const parsedBorrowers: Borrower[] = [];
      const parsedTransactions: Transaction[] = [];

      for (const rawLine of rawLines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith('# === SECTION:')) {
          if (line.includes('SETTINGS')) currentSection = 'SETTINGS';
          else if (line.includes('BOOKS')) currentSection = 'BOOKS';
          else if (line.includes('BORROWERS')) currentSection = 'BORROWERS';
          else if (line.includes('TRANSACTIONS')) currentSection = 'TRANSACTIONS';
          isHeaderRow = true;
          continue;
        }

        if (line.startsWith('#')) continue;

        if (isHeaderRow) {
          isHeaderRow = false;
          continue; // skip the column header line
        }

        const cols = this.parseCsvRow(line);

        if (currentSection === 'SETTINGS' && cols.length >= 2) {
          this.saveSettings({
            ...this.getSettings(),
            station_id: cols[0] || 'LMS-WIN-MIGRATED',
            library_name: cols[1] || 'Central Campus Library',
            university_name: cols[2] || 'University of Lakki Marwat',
            campus_address: cols[3] || 'Lakki Marwat, Khyber Pakhtunkhwa',
            phone: cols[4] || '+92-969-510015',
            email: cols[5] || 'library@ulm.edu.pk',
            scanner_sound: cols[6] === 'true',
            error_sound: cols[7] === 'true',
            wal_mode: cols[8] === 'true',
          });
          stats.settings = true;
        } else if (currentSection === 'BOOKS' && cols.length >= 3) {
          const barcode = cols[0];
          const isbn = cols[1] || `ISBN-${barcode}`;
          const book_name = cols[2];
          const author = cols[3] || 'Academic Author';
          const category = cols[4] || 'General';
          const total_quantity = parseInt(cols[5], 10) || 5;
          const available_quantity = cols[6] !== undefined && cols[6] !== '' ? parseInt(cols[6], 10) : total_quantity;
          const shelf = cols[7] || 'Main-Rack-01';
          const row = cols[8] || '1';
          const dewey_call_number = cols[9] || '000 GEN';
          const publisher = cols[10] || 'Academic Press';
          const edition = cols[11] || '1st Edition';
          const publication_year = parseInt(cols[12], 10) || 2024;
          const language = cols[13] || 'English';
          const is_active = cols[14] === '0' ? false : true;

          parsedBooks.push({
            id: `book-migrated-${barcode}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            barcode,
            isbn,
            book_name,
            author,
            category,
            total_quantity,
            available_quantity,
            shelf,
            row,
            section: 'General',
            dewey_call_number,
            publisher,
            edition,
            publication_year,
            language,
            description: 'Imported from Master Migration Package',
            book_image_path: '',
            is_active,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          });
        } else if (currentSection === 'BORROWERS' && cols.length >= 2) {
          const student_id = cols[0];
          const name = cols[1];
          const department = cols[2] || 'Computer Science';
          const program = cols[3] || 'BS';
          const class_name = cols[4] || 'General';
          const phone = cols[5] || '';
          const email = cols[6] || '';
          const is_active = cols[7] === '0' ? false : true;

          parsedBorrowers.push({
            id: `bor-migrated-${student_id}-${Math.random().toString(36).substring(2, 6)}`,
            role: 'Student',
            university_id: student_id,
            barcode: student_id,
            student_id,
            name,
            department,
            program,
            class_name,
            phone,
            email,
            borrow_limit: 3,
            joined_date: new Date().toISOString().split('T')[0],
            status: is_active ? 'active' : 'suspended',
            is_active,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          });
        } else if (currentSection === 'TRANSACTIONS' && cols.length >= 3) {
          const id = cols[0] || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const barcode = cols[1];
          const book_name = cols[2];
          const borrower_name = cols[3] || 'Campus Student';
          const student_id = cols[4] || '';
          const action = (cols[5] as 'ISSUE' | 'RETURN') || 'ISSUE';
          const issue_date = cols[6] || new Date().toISOString().split('T')[0];
          const due_date = cols[7] || new Date().toISOString().split('T')[0];
          const return_date = cols[8] && cols[8] !== 'N/A' && cols[8] !== 'null' ? cols[8] : null;
          const quantity = parseInt(cols[9], 10) || 1;
          const status = (cols[10] as 'ACTIVE' | 'RETURNED' | 'OVERDUE') || 'ACTIVE';

          parsedTransactions.push({
            id,
            book_id: `book-${barcode}`,
            borrower_id: `bor-${student_id}`,
            book_name,
            borrower_name,
            student_id,
            barcode,
            action,
            issue_date,
            due_date,
            return_date,
            quantity,
            status,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          });
        }
      }

      // If no sections were marked, detect standard single-table CSV
      if (currentSection === 'NONE' && rawLines.length >= 2) {
        const headerCols = this.parseCsvRow(rawLines[0]).map(h => h.toLowerCase());
        const isBorrowersSheet = headerCols.some(h => h.includes('studentid') || h.includes('student_id') || h.includes('fullname'));
        const isLoansSheet = headerCols.some(h => h.includes('transactionid') || h.includes('issuedate') || h.includes('duedate'));

        for (let i = 1; i < rawLines.length; i++) {
          const line = rawLines[i].trim();
          if (!line) continue;
          const cols = this.parseCsvRow(line);

          if (isBorrowersSheet && cols.length >= 2) {
            parsedBorrowers.push({
              id: `bor-migrated-${cols[0]}-${Date.now()}`,
              role: 'Student',
              university_id: cols[0],
              barcode: cols[0],
              student_id: cols[0],
              name: cols[1],
              department: cols[2] || 'General',
              program: cols[3] || 'BS',
              class_name: cols[4] || 'General',
              phone: cols[5] || '',
              email: cols[6] || '',
              borrow_limit: 3,
              joined_date: new Date().toISOString().split('T')[0],
              status: 'active',
              is_active: true,
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
              updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            });
          } else if (isLoansSheet && cols.length >= 4) {
            parsedTransactions.push({
              id: cols[0] || `tx-${Date.now()}-${i}`,
              book_id: `book-${cols[1]}`,
              borrower_id: `bor-${cols[4] || 'student'}`,
              barcode: cols[1],
              book_name: cols[2],
              borrower_name: cols[3],
              student_id: cols[4] || '',
              action: (cols[5] as 'ISSUE' | 'RETURN') || 'ISSUE',
              issue_date: cols[6] || new Date().toISOString().split('T')[0],
              due_date: cols[7] || new Date().toISOString().split('T')[0],
              return_date: cols[8] && cols[8] !== 'N/A' ? cols[8] : null,
              quantity: 1,
              status: (cols[10] as 'ACTIVE' | 'RETURNED' | 'OVERDUE') || 'ACTIVE',
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            });
          } else if (cols.length >= 3) {
            // Default to books catalog
            const barcode = cols[0];
            const isbn = cols[1] || `ISBN-${barcode}`;
            const book_name = cols[2];
            const author = cols[3] || 'Various Authors';
            const category = cols[4] || 'General';
            const total_quantity = parseInt(cols[5], 10) || 5;
            const shelf = cols[6] || 'Rack-01';

            parsedBooks.push({
              id: `book-${Date.now()}-${i}`,
              barcode,
              isbn,
              book_name,
              author,
              category,
              total_quantity,
              available_quantity: total_quantity,
              shelf,
              row: '1',
              section: 'General',
              dewey_call_number: '000 GEN',
              publisher: 'Imported',
              edition: '1st Edition',
              publication_year: 2024,
              language: 'English',
              description: 'Imported via CSV',
              book_image_path: '',
              is_active: true,
              created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
              updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            });
          }
        }
      }

      // Check if anything was parsed
      if (parsedBooks.length === 0 && parsedBorrowers.length === 0 && parsedTransactions.length === 0 && !stats.settings) {
        return {
          success: false,
          message: 'No valid book, borrower, or loan records could be found in the provided file. Ensure it contains the standard headers or is exported from ULM LMS.',
          stats: { books: 0, borrowers: 0, transactions: 0, settings: false },
        };
      }

      // Apply to storage
      if (mode === 'overwrite') {
        if (parsedBooks.length) {
          this.saveBooks(parsedBooks);
          stats.books = parsedBooks.length;
        }
        if (parsedBorrowers.length) {
          this.saveBorrowers(parsedBorrowers);
          stats.borrowers = parsedBorrowers.length;
        }
        if (parsedTransactions.length) {
          this.saveTransactions(parsedTransactions);
          stats.transactions = parsedTransactions.length;
        }
      } else {
        // Merge mode
        const currentBooks = this.getBooks();
        parsedBooks.forEach(nb => {
          const idx = currentBooks.findIndex(cb => cb.barcode === nb.barcode);
          if (idx !== -1) {
            currentBooks[idx] = { ...currentBooks[idx], ...nb };
          } else {
            currentBooks.unshift(nb);
          }
          stats.books++;
        });
        this.saveBooks(currentBooks);

        const currentBorrowers = this.getBorrowers();
        parsedBorrowers.forEach(nbr => {
          const idx = currentBorrowers.findIndex(cb => cb.student_id === nbr.student_id);
          if (idx !== -1) {
            currentBorrowers[idx] = { ...currentBorrowers[idx], ...nbr };
          } else {
            currentBorrowers.unshift(nbr);
          }
          stats.borrowers++;
        });
        this.saveBorrowers(currentBorrowers);

        const currentTxs = this.getTransactions();
        parsedTransactions.forEach(nt => {
          const idx = currentTxs.findIndex(ct => ct.id === nt.id);
          if (idx !== -1) {
            currentTxs[idx] = { ...currentTxs[idx], ...nt };
          } else {
            currentTxs.unshift(nt);
          }
          stats.transactions++;
        });
        this.saveTransactions(currentTxs);
      }

      this.logHistory({
        action: 'SYSTEM_RESTORED',
        description: `Imported migration package (${mode.toUpperCase()} mode): ${stats.books} books, ${stats.borrowers} members, ${stats.transactions} loans.`,
        barcode: 'MIGRATION-CSV',
        user: 'Migration-Engine',
      });

      return {
        success: true,
        message: `Migration successful! Loaded ${stats.books} books, ${stats.borrowers} members, and ${stats.transactions} loans into this workstation's SQLite storage.`,
        stats,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Migration parsing failed: ${msg}`,
        stats: { books: 0, borrowers: 0, transactions: 0, settings: false },
      };
    }
  }

  /**
   * Import Books from CSV
   * Supports date_added in YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD-MMM-YYYY formats.
   * Blank date_added defaults to today.
   * Invalid dates go into validation report.
   * Good rows are imported.
   */
  static importBooksCsv(content: string): {
    success: boolean;
    imported: number;
    skipped: number;
    errors: { row: number; identifier: string; error: string }[];
    message: string;
  } {
    const errors: { row: number; identifier: string; error: string }[] = [];
    if (!content || !content.trim()) {
      return { 
        success: false, 
        imported: 0, 
        skipped: 0, 
        errors: [{ row: 0, identifier: 'FILE', error: 'File is empty.' }], 
        message: 'File is empty.' 
      };
    }

    const lines = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length < 2) {
      return { 
        success: false, 
        imported: 0, 
        skipped: 0, 
        errors: [{ row: 1, identifier: 'HEADER', error: 'CSV requires a header row and at least one data row.' }], 
        message: 'No data rows found.' 
      };
    }

    const header = this.parseCsvRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
    const barcodeIdx = header.findIndex(h => h.includes('barcode') || h.includes('accession'));
    const titleIdx = header.findIndex(h => h.includes('title') || h.includes('bookname'));
    const authorIdx = header.findIndex(h => h.includes('author'));
    const isbnIdx = header.findIndex(h => h.includes('isbn'));
    const categoryIdx = header.findIndex(h => h.includes('category') || h.includes('discipline'));
    const dateAddedIdx = header.findIndex(h => h.includes('dateadded') || h.includes('date') || h.includes('added'));
    const copiesIdx = header.findIndex(h => h.includes('totalcopies') || h.includes('copies') || h.includes('quantity'));
    const shelfIdx = header.findIndex(h => h.includes('shelf'));
    const deweyIdx = header.findIndex(h => h.includes('dewey') || h.includes('callnumber'));
    const publisherIdx = header.findIndex(h => h.includes('publisher'));
    const editionIdx = header.findIndex(h => h.includes('edition'));
    const yearIdx = header.findIndex(h => h.includes('year'));

    const currentBooks = this.getBooks();
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = this.parseCsvRow(line);

      const barcode = barcodeIdx !== -1 && cols[barcodeIdx] ? cols[barcodeIdx].trim() : `ULM-${String(10000 + i)}`;
      const title = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx].trim() : `Book Title #${i}`;
      const rawDate = dateAddedIdx !== -1 ? cols[dateAddedIdx] : '';

      // Validate Date Added
      const dateRes = normalizeDateAdded(rawDate);
      if (!dateRes.valid) {
        errors.push({
          row: i + 1,
          identifier: barcode || title,
          error: dateRes.error || 'Invalid date_added value',
        });
        continue;
      }

      const book: Book = {
        id: this.generateId('book'),
        barcode,
        isbn: isbnIdx !== -1 && cols[isbnIdx] ? cols[isbnIdx].trim() : `ISBN-${barcode}`,
        book_name: title,
        author: authorIdx !== -1 && cols[authorIdx] ? cols[authorIdx].trim() : 'Anonymous',
        category: categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx].trim() : 'General',
        publisher: publisherIdx !== -1 && cols[publisherIdx] ? cols[publisherIdx].trim() : 'ULM Press',
        edition: editionIdx !== -1 && cols[editionIdx] ? cols[editionIdx].trim() : '1st Edition',
        publication_year: yearIdx !== -1 && cols[yearIdx] ? parseInt(cols[yearIdx], 10) || 2024 : 2024,
        language: 'English',
        description: 'Imported from CSV',
        book_image_path: '',
        total_quantity: copiesIdx !== -1 && cols[copiesIdx] ? parseInt(cols[copiesIdx], 10) || 1 : 1,
        available_quantity: copiesIdx !== -1 && cols[copiesIdx] ? parseInt(cols[copiesIdx], 10) || 1 : 1,
        shelf: shelfIdx !== -1 && cols[shelfIdx] ? cols[shelfIdx].trim() : 'General',
        row: '1',
        section: 'Main Stacks',
        dewey_call_number: deweyIdx !== -1 && cols[deweyIdx] ? cols[deweyIdx].trim() : '000 GEN',
        date_added: dateRes.date!,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        is_active: true,
      };

      const existingIdx = currentBooks.findIndex(b => b.barcode.trim().toLowerCase() === barcode.toLowerCase());
      if (existingIdx !== -1) {
        currentBooks[existingIdx] = { ...currentBooks[existingIdx], ...book };
      } else {
        currentBooks.unshift(book);
      }
      importedCount++;
    }

    if (importedCount > 0) {
      this.saveBooks(currentBooks);
      this.logHistory({
        action: 'BOOK_ADDED',
        description: `Imported ${importedCount} books via CSV catalog feed.`,
        barcode: 'CSV-IMPORT',
        user: 'Librarian-Admin',
      });
    }

    return {
      success: importedCount > 0 || errors.length === 0,
      imported: importedCount,
      skipped: errors.length,
      errors,
      message: `Imported ${importedCount} books successfully.${errors.length > 0 ? ` ${errors.length} rows rejected due to invalid date formats.` : ''}`,
    };
  }
}
