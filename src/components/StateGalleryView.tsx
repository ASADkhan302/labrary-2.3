import React, { useState } from 'react';
import { 
  Check, 
  Search, 
  ChevronDown, 
  Save, 
  RotateCw, 
  Trash2, 
  Plus, 
  Printer, 
  AlertCircle, 
  Info, 
  Copy, 
  Eye, 
  BookOpen, 
  Sparkles,
  Loader2,
  Calendar,
  X,
  Sliders,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import CustomSelect from './ui/CustomSelect';
import { StartScreenHeroDeco } from './decorative/StartScreenHeroDeco';
import { BootSpinesDeco } from './decorative/BootSpinesDeco';
import { EmptyStateBooksDeco } from './decorative/EmptyStateBooksDeco';
import { BookSpinesLoader } from './decorative/BookSpinesLoader';
import { ToastSuccessDeco } from './decorative/ToastSuccessDeco';

export function StateGalleryView() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [toggleState, setToggleState] = useState(true);
  const [radioState, setRadioState] = useState('option-1');
  const [checkboxState, setCheckboxState] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('4');
  const [selectedRole, setSelectedRole] = useState('Student');
  const [selectedCategory, setSelectedCategory] = useState('Computer Science');
  const [textInputVal, setTextInputVal] = useState('Sample Catalog Item');
  const [showToastPreview, setShowToastPreview] = useState(false);
  const [showModalPreview, setShowModalPreview] = useState(false);
  const [isNoDeco, setIsNoDeco] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('no-deco');
  });

  const toggleNoDeco = () => {
    if (typeof document !== 'undefined') {
      const willBeNoDeco = !document.documentElement.classList.contains('no-deco');
      document.documentElement.classList.toggle('no-deco', willBeNoDeco);
      setIsNoDeco(willBeNoDeco);
    }
  };

  const categories = [
    { value: 'Computer Science', label: 'Computer Science & Software' },
    { value: 'Mathematics', label: 'Mathematics & Statistics' },
    { value: 'Management', label: 'Management Sciences' },
    { value: 'Literature', label: 'English Literature' },
  ];

  const roles = [
    { value: 'Student', label: 'Student (BS/MS)' },
    { value: 'Faculty', label: 'Faculty / Professor' },
    { value: 'Staff', label: 'Administrative Staff' },
  ];

  const semesters = [
    { value: '1', label: 'Semester 1 (Fall)' },
    { value: '2', label: 'Semester 2 (Spring)' },
    { value: '3', label: 'Semester 3 (Fall)' },
    { value: '4', label: 'Semester 4 (Spring)' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 select-none text-[var(--text-primary)]">
      {/* Title & Guidelines Header */}
      <div className="border-b border-slate-700/60 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Dev-Only Visual Verification
            </div>
            <h1 className="text-2xl font-bold text-[#F1F5F9] tracking-tight">
              State Gallery: Zero "Heavy White" Quality Audit
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Inspect all buttons, dropdowns, inputs, chips, switches, modals, and tables in every interaction state:
              <strong className="text-slate-200"> default, hover, focus-visible, active (pressed), disabled, selected/open, loading, error</strong>.
              Pure white (<code className="text-amber-400 font-mono text-xs">#FFFFFF</code>) is strictly banned across screen UI; panels use cream tokens (<code className="text-amber-300 font-mono text-xs">--cream-100: #FBF3DF</code>) with 7:1+ contrast (<code className="text-amber-300 font-mono text-xs">--on-cream: #1C1917</code>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleNoDeco}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                isNoDeco 
                  ? 'bg-rose-950/60 border-rose-700/60 text-rose-300' 
                  : 'bg-[var(--purple-tint)] border-[var(--gold)]/60 text-[var(--gold-text)]'
              }`}
              title="Toggle html.no-deco class on root element to verify instant decoration removal"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>2D Deco: {isNoDeco ? 'OFF (no-deco active)' : 'ON (Active)'}</span>
            </button>
            <button
              onClick={() => setShowToastPreview(true)}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] active:bg-[#0F172A] text-[#F1F5F9] text-xs font-semibold border border-slate-700 transition-colors"
            >
              Test Notification Toast
            </button>
            <button
              onClick={() => setShowModalPreview(true)}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-[#FBBF24] active:bg-[#D97706] text-[#020617] text-xs font-bold shadow-md transition-colors"
            >
              Test Modal Backdrop
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: BUTTON STATES MATRIX */}
      <section className="bg-[#0B1220] border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-[#F1F5F9]">1. Button Archetypes & States Matrix</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">No white overlays on press · Slate dark tint only</span>
        </div>

        {/* Primary Amber Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Primary Actions (Amber · #F59E0B)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Default</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#F59E0B] text-[#020617] font-bold text-xs shadow-sm">
                Save Volume
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Hover (#FBBF24)</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#FBBF24] text-[#020617] font-bold text-xs shadow-sm ring-1 ring-amber-400">
                Save Volume
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Focus-Visible</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#F59E0B] text-[#020617] font-bold text-xs ring-2 ring-[#2563EB] ring-offset-2 ring-offset-[#0B1220]">
                Save Volume
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Active (#D97706)</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#D97706] text-[#020617] font-bold text-xs shadow-inner">
                Save Volume
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Disabled</span>
              <button disabled className="w-full py-2 px-3 rounded-lg bg-[#0F172A] text-slate-500 font-bold text-xs border border-slate-800 cursor-not-allowed">
                Save Volume
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Loading</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#F59E0B] text-[#020617] font-bold text-xs flex items-center justify-center gap-1.5 opacity-90">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Special "Save & Next"</span>
              <button className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-[#F1F5F9] font-bold text-xs">
                Save & Next
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Dark Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Dark / Secondary Buttons (Slate #1E293B)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Default</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#F1F5F9] text-xs font-medium border border-slate-700">
                Save a Copy
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Hover (#334155)</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#334155] text-[#F1F5F9] text-xs font-medium border border-slate-600">
                Save a Copy
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Active (Darker Slate)</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#0F172A] text-[#F1F5F9] text-xs font-medium border border-slate-700 shadow-inner">
                Save a Copy
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Link-style "Same"</span>
              <button className="w-full py-2 px-3 rounded-lg bg-transparent hover:bg-[#1E293B] text-sky-400 hover:text-sky-300 text-xs font-medium underline underline-offset-4">
                Same As Above
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Sync Data</span>
              <button className="w-full py-2 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#F1F5F9] text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700">
                <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Sync Data
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Destructive Withdraw</span>
              <button className="w-full py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 active:bg-rose-950 text-rose-200 border border-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Blue Fills (#2563EB) & Text Rule */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Blue Accent Buttons (Text #F1F5F9, Never Pure White)</h3>
          <div className="flex flex-wrap gap-3">
            <button className="py-2 px-4 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] active:bg-[#1D4ED8] text-[#F1F5F9] font-semibold text-xs transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Register Accession
            </button>
            <button className="py-2 px-4 rounded-lg bg-[#3B82F6] text-[#F1F5F9] font-semibold text-xs">
              Simulate Hover (#3B82F6)
            </button>
            <button className="py-2 px-4 rounded-lg bg-[#1D4ED8] text-[#F1F5F9] font-semibold text-xs shadow-inner">
              Simulate Pressed (#1D4ED8)
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: CUSTOM DROPDOWNS & COMBOBOXES (CREAM SURFACE) */}
      <section className="bg-[#0B1220] border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-base font-bold text-[#F1F5F9]">2. Custom Dropdowns & Comboboxes (Cream Surface)</h2>
          </div>
          <span className="text-xs text-amber-300 font-mono">--cream-100: #FBF3DF · --on-cream: #1C1917 (7:1+ Contrast)</span>
        </div>

        <p className="text-xs text-slate-400">
          Open the dropdowns below. Verify they render with an opaque cream surface, dark high-contrast text,
          hover highlight (--cream-200), amber selection bar (#F59E0B with dark checkmark), and keyboard arrow navigation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Current Semester Dropdown (Previously Reported White Bug)
            </label>
            <CustomSelect
              value={selectedSemester}
              onChange={(val) => setSelectedSemester(String(val))}
              options={semesters}
            />
            <span className="text-[11px] text-slate-500">Selected Value: {selectedSemester}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Borrower Role Dropdown
            </label>
            <CustomSelect
              value={selectedRole}
              onChange={(val) => setSelectedRole(String(val))}
              options={roles}
            />
            <span className="text-[11px] text-slate-500">Selected Value: {selectedRole}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Catalog Category Combobox (Searchable)
            </label>
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(String(val))}
              options={categories}
              searchable
            />
            <span className="text-[11px] text-slate-500">Selected Value: {selectedCategory}</span>
          </div>
        </div>

        {/* Live CSS Token Swatches */}
        <div className="p-4 rounded-lg bg-[#020617] border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Theme Token Swatches</span>
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-slate-400" style={{ backgroundColor: 'var(--cream-100, #FBF3DF)' }} />
              <span className="text-slate-300">--cream-100: #FBF3DF (Surface)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-slate-400" style={{ backgroundColor: 'var(--cream-200, #F2E6C4)' }} />
              <span className="text-slate-300">--cream-200: #F2E6C4 (Hover)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-slate-400" style={{ backgroundColor: 'var(--cream-300, #E6D3A3)' }} />
              <span className="text-slate-300">--cream-300: #E6D3A3 (Pressed)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-slate-400" style={{ backgroundColor: 'var(--on-cream, #1C1917)' }} />
              <span className="text-slate-300">--on-cream: #1C1917 (Text 7:1+)</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FORM INPUTS, AUTOCOMPLETE & DATES */}
      <section className="bg-[#0B1220] border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-base font-bold text-[#F1F5F9]">3. Input Fields, Autocomplete & Selection</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">::selection amber · :-webkit-autofill override #0F172A</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Default Text Input</label>
            <input
              type="text"
              value={textInputVal}
              onChange={(e) => setTextInputVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-[#F1F5F9] text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">Select text to verify amber ::selection</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Date Picker (color-scheme: dark)</label>
            <input
              type="date"
              defaultValue="2026-10-02"
              className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-[#F1F5F9] text-xs focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">Native calendar uses dark scheme</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Disabled Input State</label>
            <input
              type="text"
              disabled
              value="System Locked Accession"
              className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-slate-800 text-slate-500 text-xs cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-500">High contrast muted text token</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Input With Error State</label>
            <input
              type="text"
              defaultValue="Duplicate Accession #10025"
              className="w-full px-3 py-2 rounded-lg bg-rose-950/20 border border-rose-500 text-rose-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <span className="text-[10px] text-rose-400">Error outline & message</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: TOGGLES, RADIOS, CHECKBOXES & CHIPS */}
      <section className="bg-[#0B1220] border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h2 className="text-base font-bold text-[#F1F5F9]">4. Toggles, Checkboxes, Radios & Filter Chips</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">No white flashes on toggle or click</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Toggle Switch */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Segmented Toggle Switch</span>
            <button
              onClick={() => setToggleState(!toggleState)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                toggleState ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-[#020617] w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-[11px] text-slate-400">Status: {toggleState ? 'Enabled' : 'Disabled'}</span>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Styled Checkbox</span>
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxState}
                onChange={(e) => setCheckboxState(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-offset-[#0B1220] accent-amber-500 cursor-pointer"
              />
              <span>Remember repeated fields</span>
            </label>
          </div>

          {/* Radios */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Radio Option Set</span>
            <div className="flex flex-col gap-1.5 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="demo-radio"
                  checked={radioState === 'option-1'}
                  onChange={() => setRadioState('option-1')}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Borrower Type A</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="demo-radio"
                  checked={radioState === 'option-2'}
                  onChange={() => setRadioState('option-2')}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Borrower Type B</span>
              </label>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Filter Segment Chips</span>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'students', 'faculty', 'overdue'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    activeFilter === chip
                      ? 'bg-amber-500 text-[#020617] font-bold shadow-sm'
                      : 'bg-[#1E293B] text-slate-300 hover:bg-[#334155]'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TABLE ROW STATES & BADGES */}
      <section className="bg-[#0B1220] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h2 className="text-base font-bold text-[#F1F5F9]">5. Table Rows (Hover, Selected & Badges)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Row hover #1E293B · Badge contrast 4.5:1+</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#020617] text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">State</th>
                <th className="p-3">Accession #</th>
                <th className="p-3">Title</th>
                <th className="p-3">Badge Contrast</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-[#1E293B] transition-colors">
                <td className="p-3 font-semibold text-slate-300">Default Row</td>
                <td className="p-3 font-mono text-amber-400">10001</td>
                <td className="p-3 text-slate-200">Database System Concepts (Silberschatz)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Available (7.2:1)
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs">
                    Issue
                  </button>
                </td>
              </tr>

              <tr className="bg-[#1E293B]/70 hover:bg-[#1E293B] transition-colors">
                <td className="p-3 font-semibold text-amber-300">Selected Row</td>
                <td className="p-3 font-mono text-amber-400">10002</td>
                <td className="p-3 text-slate-200">Artificial Intelligence: A Modern Approach</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Loaned (6.8:1)
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-[#020617] font-bold text-xs">
                    Return
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#1E293B] transition-colors">
                <td className="p-3 font-semibold text-rose-300">Overdue Row</td>
                <td className="p-3 font-mono text-amber-400">10003</td>
                <td className="p-3 text-slate-200">Computer Networks (Tanenbaum)</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    17 Days Overdue (PKR 170 Fine)
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs border border-rose-800">
                    Collect Fine
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 8: 2D DECORATIVE VECTOR ANIMATIONS (ULM PALETTE) */}
      <section className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
            <h2 className="text-base font-bold text-[var(--strong)]">8. 2D Decorative Vector Animations (ULM Palette & Hardware Accelerated)</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {isNoDeco ? 'STATUS: ALL DECORATIONS DISABLED (html.no-deco)' : 'STATUS: HARDWARE ACCELERATED (60 FPS)'}
          </span>
        </div>

        <p className="text-xs text-[var(--text-body)]">
          All decorative animations use inline SVGs and CSS keyframe transforms/opacity only. Pure white is banned; colors use ULM Royal Purple (<code className="text-[var(--gold-text)] font-mono">#541A72</code>), Old Gold (<code className="text-[var(--gold-text)] font-mono">#BC881B</code>), Slate Blue (<code className="text-[var(--blue-text)] font-mono">#29658E</code>), and Cream tokens.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Start Screen Hero Preview */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden h-56">
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-bold text-[var(--gold-text)]">1. Start Screen Hero</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Crest + Page Flip + Motes</span>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              <StartScreenHeroDeco />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] z-10">
              Self-drawing crest (1.2s), 2D page flip (6s loop), upward gold motes (12-20s), and purple pulse glow (8s).
            </p>
          </div>

          {/* 2. Boot Splash Spines Preview */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 h-56">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--gold-text)]">2. Boot Splash Spines</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">7 Spines · 90ms Stagger</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <BootSpinesDeco />
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Row of 7 book spines in purple, gold, blue, and near-black sliding up and settling sequentially.
            </p>
          </div>

          {/* 3. Empty States Books Stack Preview */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 h-56">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--gold-text)]">3. Empty State Books</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">3 Books Bobbing · 3s Loop</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <EmptyStateBooksDeco />
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Stack of 3 books with gold ribbons and embossed titles bobbing 4px up and down smoothly.
            </p>
          </div>

          {/* 4. Barcode Scan Field Beam Preview */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 h-56">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--gold-text)]">4. Barcode Scan Field</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">2.4s Sweeping Beam</span>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-2">
              <label className="text-[11px] text-[var(--text-muted)]">Focus input to view gold sweep beam:</label>
              <div className="max-w-xs flex items-center bg-[var(--canvas)] border-2 border-[var(--border-field)] focus-within:border-[var(--gold)] rounded-lg p-1 barcode-scan-wrapper">
                <input
                  type="text"
                  placeholder="Click to focus & sweep..."
                  className="w-full bg-transparent px-2 py-1 text-xs text-[var(--strong)] font-mono focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Sweeping gold laser beam sweeps across every 2.4s on focus. Stops when unfocused.
            </p>
          </div>

          {/* 5. Loading States Spines Preview */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 h-56">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--gold-text)]">5. Loading States Spines</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">900ms Sequenced Scale</span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)]">
                <BookSpinesLoader />
                <span className="text-xs text-[var(--text-body)] font-medium">Processing Database WAL...</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Three book-spine bars (gold, purple, blue) scaling in sequence every 900ms.
            </p>
          </div>

          {/* 6. Header Gold Hairline Sweep & 7. Success Toast Checkmark */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col justify-between space-y-3 h-56">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--gold-text)]">6 & 7. Hairline & Toast</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Hairline (6s) · Toast (300ms)</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-md">
                <ToastSuccessDeco />
                <span className="text-xs text-[var(--strong)] font-medium">Record Committed</span>
              </div>
              <div className="w-full relative h-[2px] bg-[var(--border-subtle)] overflow-hidden">
                <div 
                  className="deco absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent"
                  style={{ animation: 'hairlineSweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                />
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Soft light glides along the gold hairline every 6s. Success toast checkmark draws with expanding ring.
            </p>
          </div>
        </div>
      </section>

      {/* PREVIEW TOAST MODAL */}
      {showToastPreview && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] border border-amber-500/40 text-[#F1F5F9] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-[#F1F5F9]">Toast Verification Active</p>
            <p className="text-slate-400">No white flash detected. Background is #0F172A.</p>
          </div>
          <button
            onClick={() => setShowToastPreview(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PREVIEW MODAL BACKDROP */}
      {showModalPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-[#F1F5F9]">Dialog Backdrop Audit</h3>
              <button
                onClick={() => setShowModalPreview(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              The dialog backdrop uses a dark translucent mask (<code className="text-amber-400">rgba(0,0,0,0.7)</code>) with no white overlay.
              The modal container itself is <code className="text-amber-400">#0B1220</code>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalPreview(false)}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#F1F5F9] text-xs font-semibold"
              >
                Close Audit Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
