import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Save, 
  Sparkles, 
  AlertCircle, 
  Barcode as BarcodeIcon,
  MapPin,
  Layers,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Link2,
  CheckCircle2,
  FileText,
  Palette,
  Loader2,
  Check
} from 'lucide-react';
import { Book } from '../../types/library';

interface AddEditBookModalProps {
  isOpen: boolean;
  bookToEdit?: Book | null;
  initialBarcode?: string;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => { success: boolean; message: string };
  onUpdate: (id: string, updates: Partial<Book>) => { success: boolean; message: string };
  onDelete?: (book: Book) => void;
}

// Curated academic presets for 1-click book covers
const PRESET_COVERS = [
  {
    name: 'CS / Cyber',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    color: 'from-blue-900 to-indigo-950'
  },
  {
    name: 'Algorithms',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    color: 'from-amber-900 to-slate-950'
  },
  {
    name: 'Mathematics',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
    color: 'from-emerald-950 to-slate-900'
  },
  {
    name: 'Literature',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    color: 'from-rose-950 to-slate-900'
  }
];

export const AddEditBookModal: React.FC<AddEditBookModalProps> = ({
  isOpen,
  bookToEdit,
  initialBarcode,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const [barcode, setBarcode] = useState('');
  const [isbn, setIsbn] = useState('');
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [edition, setEdition] = useState('1st Edition');
  const [publicationYear, setPublicationYear] = useState(2024);
  const [language, setLanguage] = useState('English');
  const [description, setDescription] = useState('');
  const [bookImagePath, setBookImagePath] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(5);
  const [availableQuantity, setAvailableQuantity] = useState(5);
  const [shelf, setShelf] = useState('CS-Rack-01');
  const [row, setRow] = useState('A-1');
  const [section, setSection] = useState('Main Stacks');
  const [deweyCallNumber, setDeweyCallNumber] = useState('005.133 ULM');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'success'>('idle');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (bookToEdit) {
      setBarcode(bookToEdit.barcode);
      setIsbn(bookToEdit.isbn);
      setBookName(bookToEdit.book_name);
      setAuthor(bookToEdit.author);
      setPublisher(bookToEdit.publisher || '');
      setCategory(bookToEdit.category);
      setEdition(bookToEdit.edition || '1st Edition');
      setPublicationYear(bookToEdit.publication_year || 2024);
      setLanguage(bookToEdit.language || 'English');
      setDescription(bookToEdit.description || '');
      setBookImagePath(bookToEdit.book_image_path || '');
      setTotalQuantity(bookToEdit.total_quantity);
      setAvailableQuantity(bookToEdit.available_quantity);
      setShelf(bookToEdit.shelf || 'CS-Rack-01');
      setRow(bookToEdit.row || 'A-1');
      setSection(bookToEdit.section || 'Main Stacks');
      setDeweyCallNumber(bookToEdit.dewey_call_number || '005.133 ULM');
    } else {
      // New book initialization
      const generatedCode = initialBarcode || `9780${Math.floor(100000000 + Math.random() * 900000000)}`;
      setBarcode(generatedCode);
      setIsbn(`978-0-${generatedCode.slice(4, 9)}-${generatedCode.slice(9, 12)}-${generatedCode.slice(12)}`);
      setBookName('');
      setAuthor('');
      setPublisher('Academic Press');
      setCategory('Computer Science');
      setEdition('1st Edition');
      setPublicationYear(2024);
      setLanguage('English');
      setDescription('');
      setBookImagePath('');
      setTotalQuantity(5);
      setAvailableQuantity(5);
      setShelf('CS-Rack-01');
      setRow('A-1');
      setSection('Main Stacks');
      setDeweyCallNumber('005.133 ULM');
    }
    setErrorMessage(null);
    setShowUrlInput(false);
    setTempUrl('');
  }, [bookToEdit, initialBarcode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    const code = `9780${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBarcode(code);
    setIsbn(`978-${code.slice(3, 4)}-${code.slice(4, 9)}-${code.slice(9, 12)}-${code.slice(12)}`);
  };

  // Process and compress image to high-fidelity, lightweight data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }
    
    setIsProcessingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High-res downscale target (600x800 maximum bounds)
        const maxW = 600;
        const maxH = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setBookImagePath(compressed);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setErrorMessage('Failed to decode the selected image.');
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the image file.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      setBookImagePath(tempUrl.trim());
      setShowUrlInput(false);
      setTempUrl('');
    }
  };

  const handleRemoveImage = () => {
    setBookImagePath('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim() || !author.trim() || !barcode.trim()) {
      setErrorMessage('Book Title, Author, and Barcode are required.');
      return;
    }

    if (totalQuantity < 1) {
      setErrorMessage('Total quantity must be at least 1 copy.');
      return;
    }

    const validAvailable = Math.min(availableQuantity, totalQuantity);

    const payload = {
      barcode: barcode.trim(),
      isbn: isbn.trim(),
      book_name: bookName.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      category,
      edition,
      publication_year: Number(publicationYear),
      language,
      description: description.trim(),
      book_image_path: bookImagePath.trim(),
      total_quantity: Number(totalQuantity),
      available_quantity: Number(validAvailable),
      shelf: shelf.trim(),
      row: row.trim(),
      section: section.trim(),
      dewey_call_number: deweyCallNumber.trim(),
    };

    if (bookToEdit) {
      const res = onUpdate(bookToEdit.id, payload);
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
    } else {
      const res = onSave(payload);
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
    }

    setSaveState('success');
    setTimeout(() => {
      setSaveState('idle');
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Styled with Unique Header Font & Upscaled Institutional Branding */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50 dark:bg-[#020617] border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-2xs">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-header text-lg sm:text-xl font-bold tracking-wide text-slate-900 dark:text-white">
                  {bookToEdit ? 'Edit Catalog Record' : 'Register New Book in Catalog'}
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {bookToEdit ? 'Record Mode' : 'New Entry'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono-code mt-0.5">
                University of Lakki Marwat · Central Archival Stacks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Renewed Form Body with Enhanced Spacing & Book Picture Upload Studio */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-7 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: BOOK MEDIA STUDIO & COVER PHOTO UPLOAD */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#020617]/70 border border-slate-200 dark:border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Book Cover Picture & Media Studio
                </h4>
              </div>
              {bookImagePath && (
                <span className="text-[11px] font-mono-code text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cover Photo Attached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Live Realistic Hardcover Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div 
                  data-preserve-dark="true"
                  className="relative w-36 h-48 sm:w-40 sm:h-52 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl overflow-hidden flex flex-col justify-between p-3 select-none transition-transform hover:scale-[1.02]"
                >
                  {bookImagePath ? (
                    <img
                      src={bookImagePath}
                      alt="Book Cover Preview"
                      className="absolute inset-0 w-full h-full object-cover z-0"
                      onError={() => setBookImagePath('')}
                    />
                  ) : null}

                  {/* Embossed gold foil book spine accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-amber-700/70 via-amber-400 to-amber-700/50 z-10 shadow-sm" />

                  {/* Fallback geometric editorial styling if no cover image */}
                  <div className={`relative z-10 h-full flex flex-col justify-between text-left ${bookImagePath ? 'bg-gradient-to-t from-black/85 via-transparent to-black/40 -m-3 p-3' : ''}`}>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono-code text-amber-300 font-bold uppercase tracking-wider pl-1">
                        ULM PRESS
                      </span>
                      <p data-preserve-white="true" className="font-header font-bold text-white text-xs leading-snug line-clamp-3 pl-1 drop-shadow-sm">
                        {bookName || 'Untitled Volume'}
                      </p>
                    </div>
                    <div className="pl-1">
                      <p className="text-[10px] text-slate-300 truncate font-medium drop-shadow-sm">
                        {author || 'Academic Faculty'}
                      </p>
                      <p className="text-[8.5px] font-mono-code text-amber-400 font-semibold mt-0.5">
                        {deweyCallNumber || '005.133'}
                      </p>
                    </div>
                  </div>
                </div>

                {bookImagePath && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-2.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone & Action Options */}
              <div className="md:col-span-8 space-y-3.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-300 dark:border-slate-700 hover:border-amber-500/60 bg-white dark:bg-[#0A0F1D]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isProcessingImage ? 'Optimizing photo resolution...' : 'Click to Upload Book Picture or Drag & Drop'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Supports high-resolution PNG, JPG, or WebP (auto-optimized)
                    </p>
                  </div>
                </div>

                {/* Alternate Options: Presets & Image URL */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Quick Presets:
                    </span>
                    {PRESET_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setBookImagePath(preset.url)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{showUrlInput ? 'Hide URL' : 'Use Web URL'}</span>
                  </button>
                </div>

                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                    <input
                      type="url"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://example.com/book-cover.jpg"
                      className="flex-1 bg-white dark:bg-[#0A0F1D] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 font-mono-code"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: BIBLIOGRAPHIC IDENTITY (GENEROUS SPACING) */}
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Bibliographic Identity & Academic Discipline</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Book Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="e.g. Modern Compiler Implementation in C++"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs font-medium"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Author(s) / Editor(s) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Andrew W. Appel & Jens Palsberg"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Discipline / Faculty
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Artificial Intelligence">Artificial Intelligence & Data</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Islamic Studies">Islamic Studies</option>
                  <option value="Literature">Literature</option>
                  <option value="General Reference">General Reference</option>
                </select>
              </div>

              {/* Publisher */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Publisher
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Cambridge University Press"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs"
                />
              </div>

              {/* Edition & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="2nd Edition"
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(parseInt(e.target.value, 10) || 2024)}
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white font-mono-code focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: BARCODE IDENTIFIERS & DEWEY DECIMAL SYSTEM */}
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BarcodeIcon className="w-4 h-4 text-amber-500" />
              <span>Library Classification & Scannable Identifiers</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Barcode */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Barcode <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-mono-code font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white font-mono-code font-bold tracking-wider focus:outline-hidden focus:border-amber-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* ISBN */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ISBN-13 Standard
                </label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-0-..."
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono-code focus:outline-hidden focus:border-amber-500 shadow-2xs"
                />
              </div>

              {/* Dewey Call Number */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dewey Call Number
                </label>
                <input
                  type="text"
                  value={deweyCallNumber}
                  onChange={(e) => setDeweyCallNumber(e.target.value)}
                  placeholder="005.133 ULM"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono-code font-semibold focus:outline-hidden focus:border-amber-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: INVENTORY VOLUME & STACK PLACEMENT */}
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Physical Volume Holdings & Shelf Coordinates</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Copies Count */}
              <div className="md:col-span-6 p-4 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Total Copies In Stacks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalQuantity}
                    onChange={(e) => {
                      const total = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setTotalQuantity(total);
                      if (availableQuantity > total) setAvailableQuantity(total);
                    }}
                    className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono-code font-bold tabular-nums"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                    Available For Loan
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalQuantity}
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(Math.min(totalQuantity, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-lg px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-mono-code font-bold tabular-nums"
                  />
                </div>
              </div>

              {/* Shelf Coordinates */}
              <div className="md:col-span-6 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Shelf Rack
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="CS-Rack-01"
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono-code focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Row No.
                  </label>
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    placeholder="A-1"
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono-code focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Main Stacks"
                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CATALOG ABSTRACT & DESCRIPTION (UPSCALED TEXT SIZE FOR PREMIUM LOOK) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                Catalog Description & Course Abstract
              </label>
              <span className="text-xs text-slate-400 font-mono-code">
                {description.length} characters
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Provide syllabus alignment, prerequisites, table of contents overview, or course reference notes.
            </p>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed catalog summary, course code references, syllabus modules, or academic review notes..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-[#334155] rounded-xl p-4 text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 transition-colors shadow-2xs resize-y"
            />
          </div>

          {/* Action Footer Bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {bookToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(bookToEdit);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete or archive this book"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Delete Title</span>
                </button>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Record synchronized to SQLite</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveState !== 'idle'}
                className="min-w-[150px] flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {saveState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveState === 'success' ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-950 font-bold animate-in zoom-in-75 duration-200">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved</span>
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{bookToEdit ? 'Save Changes' : 'Register Book'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
