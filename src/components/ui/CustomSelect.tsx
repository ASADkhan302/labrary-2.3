import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Plus, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: (SelectOption | string | number)[];
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowAdd?: boolean;
  onAddNew?: (newValue: string) => void;
  addNewPlaceholder?: string;
  id?: string;
  name?: string;
  compact?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  label,
  className = '',
  triggerClassName = '',
  panelClassName = '',
  disabled = false,
  searchable,
  allowAdd = false,
  onAddNew,
  addNewPlaceholder = 'Add new...',
  id,
  name,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [newInputValue, setNewInputValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      return opt;
    });
  }, [options]);

  // Filtered options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Determine currently selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const isSearchable = searchable ?? normalizedOptions.length > 7;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      // Find index of current selected option in filtered list
      const idx = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
      setActiveIndex(idx >= 0 ? idx : 0);

      if (isSearchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
      setIsAddingNew(false);
    }
  }, [isOpen, value, filteredOptions, isSearchable]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next].disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;

      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setActiveIndex(filteredOptions.length - 1);
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          const item = filteredOptions[activeIndex];
          if (!item.disabled) {
            onChange(item.value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;

      default:
        break;
    }
  };

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInputValue.trim();
    if (!trimmed) return;
    if (onAddNew) {
      onAddNew(trimmed);
    } else {
      onChange(trimmed);
    }
    setNewInputValue('');
    setIsAddingNew(false);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative select-none text-left ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-300 mb-1 leading-normal"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        name={name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border text-left transition-colors cursor-pointer ${
          compact ? 'h-8 px-2.5 py-1 text-xs' : 'h-10 px-3 py-2 text-xs'
        } ${
          disabled
            ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed pointer-events-none'
            : isOpen
            ? 'bg-[#0B1220] border-blue-500 ring-2 ring-blue-500/30 text-slate-100'
            : 'bg-[#0B1220] hover:bg-[#0F172A] border-[#334155] hover:border-slate-500 text-slate-200'
        } ${triggerClassName}`}
      >
        <span className="truncate block font-medium">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* Styled Popup Panel using specified Cream Tokens */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          style={{
            backgroundColor: 'var(--cream-100, #FBF3DF)',
            color: 'var(--on-cream, #1C1917)',
            borderColor: 'var(--cream-300, #E6D3A3)',
          }}
          className={`absolute left-0 right-0 z-50 mt-1 min-w-[200px] rounded-xl border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 ${panelClassName}`}
        >
          {/* Optional Search Input */}
          {isSearchable && (
            <div
              style={{
                borderColor: 'var(--cream-300, #E6D3A3)',
                backgroundColor: 'var(--cream-100, #FBF3DF)',
              }}
              className="p-2 border-b flex items-center gap-1.5"
            >
              <Search style={{ color: 'var(--on-cream, #1C1917)' }} className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search..."
                style={{
                  backgroundColor: 'var(--cream-200, #F2E6C4)',
                  color: 'var(--on-cream, #1C1917)',
                  borderColor: 'var(--cream-300, #E6D3A3)',
                }}
                className="w-full text-xs px-2 py-1 rounded-md border outline-none placeholder:text-stone-500 focus:ring-1 focus:ring-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: 'var(--on-cream, #1C1917)' }}
                  className="p-0.5 hover:opacity-100 opacity-60 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* List Options */}
          <ul
            ref={listboxRef}
            className="max-h-60 overflow-y-auto p-1.5 space-y-0.5"
            style={{
              scrollbarColor: 'var(--cream-300, #E6D3A3) var(--cream-100, #FBF3DF)',
            }}
          >
            {filteredOptions.length === 0 ? (
              <li
                style={{ color: 'var(--on-cream, #1C1917)' }}
                className="px-3 py-3 text-xs text-center opacity-70 italic"
              >
                No matching options found
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isActive = idx === activeIndex;

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                    style={{
                      backgroundColor: isSelected
                        ? '#F59E0B' // Amber selected option as requested
                        : isActive
                        ? 'var(--cream-200, #F2E6C4)' // Hover on cream
                        : 'transparent',
                      color: 'var(--on-cream, #1C1917)', // Always >= 7:1 contrast on cream/amber
                    }}
                    className={`relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex flex-col truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] opacity-75 font-normal truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          style={{
                            backgroundColor: isSelected ? 'rgba(0,0,0,0.15)' : 'var(--cream-300, #E6D3A3)',
                            color: '#1C1917',
                          }}
                          className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold"
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Optional "Add New" footer */}
          {allowAdd && (
            <div
              style={{
                borderColor: 'var(--cream-300, #E6D3A3)',
                backgroundColor: 'var(--cream-200, #F2E6C4)',
              }}
              className="p-2 border-t"
            >
              {!isAddingNew ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    setTimeout(() => addInputRef.current?.focus(), 50);
                  }}
                  style={{ color: 'var(--on-cream, #1C1917)' }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-[#E6D3A3] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add custom entry...</span>
                </button>
              ) : (
                <form onSubmit={handleCreateNew} className="flex items-center gap-1.5">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newInputValue}
                    onChange={(e) => setNewInputValue(e.target.value)}
                    placeholder={addNewPlaceholder}
                    style={{
                      backgroundColor: 'var(--cream-100, #FBF3DF)',
                      color: 'var(--on-cream, #1C1917)',
                      borderColor: 'var(--cream-300, #E6D3A3)',
                    }}
                    className="flex-1 text-xs px-2 py-1 rounded-md border outline-none placeholder:text-stone-500 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewInputValue('');
                    }}
                    className="p-1 text-stone-600 hover:text-stone-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
