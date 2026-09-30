import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  ArrowRightLeft, 
  Edit3, 
  Printer, 
  Barcode as BarcodeIcon,
  MapPin,
  ExternalLink,
  BookMarked,
  Trash2,
  BarChart3,
  X
} from 'lucide-react';
import { Book, Transaction } from '../types/library';
import { CatalogChartsView } from './catalog/CatalogChartsView';
import { CountUp } from '@/components/ui/count-up';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

interface BooksCatalogViewProps {
  books: Book[];
  transactions: Transaction[];
  onOpenAddBook: () => void;
  onSelectBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onQuickLoan: (book: Book) => void;
  onPrintBarcode: (book: Book) => void;
}

export const BooksCatalogView: React.FC<BooksCatalogViewProps> = ({
  books,
  transactions,
  onOpenAddBook,
  onSelectBook,
  onEditBook,
  onDeleteBook,
  onQuickLoan,
  onPrintBarcode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'copies' | 'year'>('title');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');

  // Compute metrics from actual database
  const activeBooks = useMemo(() => books.filter(b => b.is_active), [books]);
  const totalTitles = activeBooks.length;
  const totalCopies = activeBooks.reduce((sum, b) => sum + b.total_quantity, 0);
  const totalAvailable = activeBooks.reduce((sum, b) => sum + b.available_quantity, 0);
  const activeBorrowed = totalCopies - totalAvailable;
  
  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => t.status === 'OVERDUE' || (t.status === 'ACTIVE' && t.due_date < today)).length;
  }, [transactions]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(activeBooks.map(b => b.category));
    return Array.from(set);
  }, [activeBooks]);

  // Filtered & sorted books
  const filteredBooks = useMemo(() => {
    return activeBooks
      .filter(book => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = !query || 
          book.book_name.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.barcode.toLowerCase().includes(query) ||
          book.isbn.toLowerCase().includes(query) ||
          book.dewey_call_number.toLowerCase().includes(query);

        const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;
        const matchesStatus = 
          selectedStatus === 'ALL' ||
          (selectedStatus === 'AVAILABLE' && book.available_quantity > 0) ||
          (selectedStatus === 'LOANED' && book.available_quantity === 0);

        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.book_name.localeCompare(b.book_name);
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        if (sortBy === 'copies') return b.total_quantity - a.total_quantity;
        if (sortBy === 'year') return b.publication_year - a.publication_year;
        return 0;
      });
  }, [activeBooks, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Generate SVG-like barcode bars based on barcode string (always high contrast in light & dark)
  const renderBarcodeStrip = (code: string) => {
    return (
      <div 
        className="barcode-container flex items-center gap-[1.5px] h-6 px-1.5 py-0.5 bg-white rounded border border-slate-300 shadow-2xs select-none" 
        title={`Barcode: ${code}`}
        data-barcode-container="true"
      >
        {code.split('').map((char, idx) => {
          const num = parseInt(char, 10) || 3;
          const w = (num % 3) + 1;
          return (
            <div
              key={idx}
              className="barcode-bar h-full"
              style={{ width: `${w}px`, backgroundColor: '#000000', minWidth: '1px' }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-8 py-7 overflow-y-auto space-y-7">
      <div className="max-w-[1920px] mx-auto space-y-7">
        
        {/* Operational Collection Metrics (Institutional Library Standard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Cataloged Titles */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:border-blue-500/30 transition-all card-stagger-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cataloged Titles</p>
                <h3 className="text-[28px] font-bold text-[var(--text-primary)] mt-1 tabular-nums leading-tight">
                  <CountUp end={totalTitles} durationMs={800} />
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
                  Across {categories.length} disciplines
                </p>
              </div>
              <div className="w-10 h-10 rounded-[8px] bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-[var(--text-accent)] shrink-0">
                <BookOpen className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Metric 2: Physical Volumes */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:border-blue-500/30 transition-all card-stagger-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Physical Volumes</p>
                <h3 className="text-[28px] font-bold text-[var(--text-primary)] mt-1 tabular-nums leading-tight">
                  <CountUp end={totalCopies} durationMs={800} />
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
                  {activeBorrowed} currently in circulation
                </p>
              </div>
              <div className="w-10 h-10 rounded-[8px] bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                <Layers className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Metric 3: Shelf Availability */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:border-blue-500/30 transition-all card-stagger-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Shelf Availability</p>
                <h3 className="text-[28px] font-bold text-emerald-500 dark:text-emerald-400 mt-1 tabular-nums leading-tight">
                  <CountUp end={totalAvailable} durationMs={800} />
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
                  {totalCopies > 0 ? `${Math.round((totalAvailable / totalCopies) * 100)}% available for loan` : '100% available'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-[8px] bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Metric 4: Active Loans & Overdue */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[12px] p-5 shadow-[var(--shadow-card)] hover:border-blue-500/30 transition-all card-stagger-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Active Loans</p>
                <h3 className="text-[28px] font-bold text-[var(--text-primary)] mt-1 tabular-nums leading-tight">
                  <CountUp end={activeBorrowed} durationMs={800} />
                </h3>
                <p className="text-[12px] mt-1.5 flex items-center gap-1.5 font-medium">
                  {overdueCount > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {overdueCount} overdue {overdueCount === 1 ? 'notice' : 'notices'}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">All current (0 overdue)</span>
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-[8px] bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Action Bar */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          {/* Left: Wide search input field with [Ctrl + K] badge */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Author, ISBN-13, Barcode, Call Number..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg pl-10 pr-24 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors search-input-expand"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-icon absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono-code text-slate-500 dark:text-slate-400">
              <span>Ctrl + K</span>
            </div>
          </div>

          {/* Center: Dropdown selects */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-amber-500"
            >
              <option value="ALL">All Disciplines</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-amber-500"
            >
              <option value="ALL">All Copies</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="LOANED">Fully Loaned</option>
            </select>

            {/* Sort select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'copies' | 'year')}
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-amber-500"
            >
              <option value="title">Sort: Title (A-Z)</option>
              <option value="author">Sort: Author (A-Z)</option>
              <option value="copies">Sort: Total Copies</option>
              <option value="year">Sort: Publication Year</option>
            </select>
          </div>

          {/* Right: Grid/List toggle + "+ Add New Book" primary button */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to Card Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to Table List View"
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  viewMode === 'chart' 
                    ? 'bg-white dark:bg-[#1E293B] text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/80 dark:border-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to Interactive Chart Analytics View"
                aria-label="Chart View"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Chart View</span>
              </button>
            </div>

            <button
              onClick={onOpenAddBook}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Catalog Display: Chart View, Grid View or List View */}
        {viewMode === 'chart' ? (
          <CatalogChartsView
            books={books}
            transactions={transactions}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setViewMode('grid');
            }}
            onSwitchView={(mode) => setViewMode(mode)}
          />
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-2xs">
            <BookMarked className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">No matching books found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No titles match your active filter criteria. Try clearing your search keyword or switching category filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedStatus('ALL'); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Reset Search Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* 4-column responsive grid of high-fidelity book cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const isAvailable = book.available_quantity > 0;
              const issuedCount = book.total_quantity - book.available_quantity;

              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700 rounded-xl overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between group transition-all duration-200 relative"
                >
                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Top Row: Thumbnail + Meta info header */}
                    <div className="flex gap-3">
                      {/* Book Cover Thumbnail with realistic spine and embossed cover art */}
                      <div 
                        onClick={() => onSelectBook(book)}
                        data-preserve-dark="true"
                        className="w-20 h-28 shrink-0 rounded-md overflow-hidden bg-slate-800 border border-slate-700/80 shadow-md relative group/cover cursor-pointer flex flex-col justify-between p-1.5"
                      >
                        {book.book_image_path ? (
                          <img
                            src={book.book_image_path}
                            alt={book.book_name}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              // Zero-broken-image fallback to styled CSS cover
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}

                        {/* Foil embossed spine accent on the left edge */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-amber-700/60 via-amber-400/80 to-amber-700/40 z-10 shadow-sm" />

                        {/* Geometric styling fallback behind image */}
                        <div className="relative z-0 h-full flex flex-col justify-between p-1 text-[8px] leading-tight select-none">
                          <span className="font-mono-code text-[7px] text-amber-300 font-bold uppercase tracking-wider pl-1">
                            ULM PRESS
                          </span>
                          <span data-preserve-white="true" className="font-header text-[8.5px] font-bold text-white line-clamp-3 pl-1">
                            {book.book_name}
                          </span>
                          <span className="text-[7px] font-mono-code text-slate-300 pl-1">
                            {book.dewey_call_number}
                          </span>
                        </div>
                      </div>

                      {/* Header Meta Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {book.category}
                            </span>
                            <span className="text-[9.5px] font-mono-code text-slate-500 dark:text-slate-400">
                              {book.edition}
                            </span>
                          </div>

                          <h4 
                            onClick={() => onSelectBook(book)}
                            className="font-header text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition-colors mt-1 line-clamp-2 cursor-pointer leading-snug"
                            title={book.book_name}
                          >
                            {book.book_name}
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            by <span className="text-slate-800 dark:text-slate-300 font-medium">{book.author}</span>
                          </p>
                        </div>

                        {/* Call number & Shelf location */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{book.shelf} · Row {book.row}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Row: ISBN pill & Dewey call number */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-[#020617] rounded-lg p-2 border border-slate-200 dark:border-[#1E293B]">
                      <div className="truncate">
                        <span className="text-slate-500 font-mono-code text-[10px]">ISBN: </span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono-code font-medium text-[10.5px]">{book.isbn}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-amber-700 dark:text-amber-400 font-mono-code text-[10px] font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {book.dewey_call_number}
                        </span>
                      </div>
                    </div>

                    {/* Barcode Visual Strip & Monospace String */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#020617] rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-[#1E293B]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BarcodeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono-code text-[11px] text-slate-800 dark:text-slate-200 tracking-wider truncate font-semibold">
                          {book.barcode}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {renderBarcodeStrip(book.barcode)}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center justify-between pt-0.5">
                      {isAvailable ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Available ({book.available_quantity} copies)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>All Copies Loaned</span>
                        </div>
                      )}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-code tabular-nums">
                        {issuedCount} issued / {book.total_quantity} tot
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#020617]/70 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-2">
                    {/* Quick Loan Button */}
                    <button
                      onClick={() => onQuickLoan(book)}
                      disabled={!isAvailable}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isAvailable
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      }`}
                      title={isAvailable ? 'Quickly issue a copy of this book' : 'No available copies left on shelf'}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Quick Loan</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditBook(book)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#334155] transition-colors cursor-pointer"
                      title="Edit book details & inventory quantities"
                      aria-label="Edit book details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Barcode Print Button */}
                    <button
                      onClick={() => onPrintBarcode(book)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-[#334155] transition-colors cursor-pointer"
                      title="Print official barcode sticker with campus insignia"
                      aria-label="Print official barcode sticker"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Book Button */}
                    <button
                      onClick={() => onDeleteBook(book)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#0F172A] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-[#334155] hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer"
                      title="Delete or archive book"
                      aria-label="Delete book"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Details modal trigger */}
                    <button
                      onClick={() => onSelectBook(book)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#1E293B] text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 border border-slate-200 dark:border-[#334155] transition-colors cursor-pointer"
                      title="Full book specification & history"
                      aria-label="Full book specification & history"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View: High Density Table with refined row padding */
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#020617] text-slate-600 dark:text-slate-400 uppercase font-mono-code text-[11px] border-b border-slate-200 dark:border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Barcode / Call No</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Issued</th>
                    <th className="py-3 px-4">Shelf / Row</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E293B]">
                  {filteredBooks.map((book) => {
                    const isAvailable = book.available_quantity > 0;
                    const issued = book.total_quantity - book.available_quantity;

                    return (
                      <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-9 rounded bg-slate-800 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center font-cinzel text-[8px] text-amber-300 font-bold">
                              {book.book_name.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <p 
                                onClick={() => onSelectBook(book)}
                                className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer truncate max-w-xs md:max-w-md"
                              >
                                {book.book_name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{book.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {book.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono-code">
                          <p className="text-slate-900 dark:text-white font-medium">{book.barcode}</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{book.dewey_call_number}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-mono-code tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {book.total_quantity}
                        </td>
                        <td className="py-3 px-4 text-center font-mono-code tabular-nums font-bold">
                          <span className={isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {book.available_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono-code tabular-nums text-slate-500 dark:text-slate-400">
                          {issued}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {book.shelf} · Row {book.row}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onQuickLoan(book)}
                              disabled={!isAvailable}
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isAvailable
                                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Loan</span>
                            </button>
                            <button
                              onClick={() => onEditBook(book)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Edit"
                              aria-label="Edit title record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onPrintBarcode(book)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Print Barcode"
                              aria-label="Print Barcode"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteBook(book)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer"
                              title="Delete Book"
                              aria-label="Delete Book"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
