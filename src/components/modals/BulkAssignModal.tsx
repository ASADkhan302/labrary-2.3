import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Book, Almari, BookGroup } from '../../types/library';
import { AlmariService } from '../../services/almariService';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooks: Book[];
  allBooks: Book[];
  mode: 'assign_group' | 'assign_almari' | 'suggest_all_unassigned';
  onComplete: (updatedBooks: Book[], message: string) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  selectedBooks,
  allBooks,
  mode,
  onComplete,
}) => {
  const groups = AlmariService.getGroups().filter(g => g.is_active);
  const almaris = AlmariService.getAlmaris().filter(a => a.is_active);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [selectedAlmariId, setSelectedAlmariId] = useState<string>(almaris[0]?.id || '');
  const [selectedShelfNo, setSelectedShelfNo] = useState<number>(1);

  // Suggest almari preview table state
  const unassignedBooks = mode === 'suggest_all_unassigned'
    ? allBooks.filter(b => b.is_active && !b.almari_id)
    : selectedBooks;

  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    return new Set(unassignedBooks.map(b => b.id));
  });

  if (!isOpen) return null;

  // Compute suggestions preview
  const previewRows = unassignedBooks.map(b => {
    // 1. Determine group
    let grp: BookGroup | null = null;
    if (b.group_id) {
      grp = groups.find(g => g.id === b.group_id) || null;
    }
    if (!grp) {
      grp = AlmariService.suggestGroup(b);
    }

    // 2. Suggest Almari & shelf
    let suggestion: { almari: Almari; shelf_no: number } | null = null;
    if (grp) {
      suggestion = AlmariService.suggestAlmariAndShelf(grp.id, allBooks);
    }

    return {
      book: b,
      group: grp,
      suggestedAlmari: suggestion?.almari || null,
      suggestedShelf: suggestion?.shelf_no || null,
    };
  });

  const toggleCheck = (id: string) => {
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIds(next);
  };

  const toggleAll = () => {
    if (checkedIds.size === previewRows.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(previewRows.map(r => r.book.id)));
    }
  };

  // Execution handlers
  const handleApplyGroup = () => {
    if (!selectedGroupId) return;
    const grp = groups.find(g => g.id === selectedGroupId);
    const updated = selectedBooks.map(b => ({
      ...b,
      group_id: selectedGroupId,
    }));
    onComplete(updated, `Assigned ${selectedBooks.length} book(s) to group "${grp?.name_en}".`);
    onClose();
  };

  const handleApplyAlmari = () => {
    if (!selectedAlmariId) return;
    const alm = almaris.find(a => a.id === selectedAlmariId);
    const updated = selectedBooks.map(b => {
      const fromStr = b.almari_id ? `${b.almari_id}, Shelf ${b.shelf_no || 1}` : 'No almari';
      const toStr = `${alm?.code}, Shelf ${selectedShelfNo}`;
      AlmariService.recordMove({
        book_id: b.id,
        from: fromStr,
        to: toStr,
        reason: 'Bulk Almari assignment',
      });
      return {
        ...b,
        almari_id: selectedAlmariId,
        shelf_no: selectedShelfNo,
        shelf: `${alm?.code}-Shelf-${selectedShelfNo}`,
      };
    });
    onComplete(updated, `Assigned ${selectedBooks.length} book(s) to ${alm?.code}, Shelf ${selectedShelfNo}.`);
    onClose();
  };

  const handleApplySuggestions = () => {
    const applied: Book[] = [];
    previewRows.forEach(row => {
      if (!checkedIds.has(row.book.id)) return;
      if (!row.suggestedAlmari) return; // Skip if no match

      const fromStr = row.book.almari_id ? `${row.book.almari_id}` : 'No almari';
      const toStr = `${row.suggestedAlmari.code}, Shelf ${row.suggestedShelf}`;

      AlmariService.recordMove({
        book_id: row.book.id,
        from: fromStr,
        to: toStr,
        reason: 'Auto-suggested Almari allocation',
      });

      applied.push({
        ...row.book,
        group_id: row.group?.id || row.book.group_id || null,
        almari_id: row.suggestedAlmari.id,
        shelf_no: row.suggestedShelf,
        shelf: `${row.suggestedAlmari.code}-Shelf-${row.suggestedShelf}`,
      });
    });

    onComplete(applied, `Applied suggested Almari placement to ${applied.length} books.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#141214] border border-[var(--border-subtle)] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-[var(--gold)] shrink-0" />

        {/* Header */}
        <div className="px-6 py-4 bg-[#1A1A1A] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold-text)]">
              {mode === 'assign_group' ? (
                <Layers className="w-5 h-5" />
              ) : mode === 'assign_almari' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {mode === 'assign_group' && `Assign Group (${selectedBooks.length} selected)`}
                {mode === 'assign_almari' && `Assign to Almari (${selectedBooks.length} selected)`}
                {mode === 'suggest_all_unassigned' && `Suggest Almari for Unassigned Books (${unassignedBooks.length} books)`}
              </h3>
              <p className="text-[12px] text-[var(--text-muted)]">
                {mode === 'assign_group' && 'Choose a Book Group to apply to all selected titles.'}
                {mode === 'assign_almari' && 'Assign a cupboard (Almari) and shelf level. Barcode and call number will not change.'}
                {mode === 'suggest_all_unassigned' && 'Preview suggested Almari and shelf positions. Never changes existing assignments.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Mode 1: Assign Group */}
          {mode === 'assign_group' && (
            <div className="space-y-4">
              <label className="block text-[12px] font-semibold text-[var(--text-body)]">
                Select Target Book Group:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {groups.map(grp => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setSelectedGroupId(grp.id)}
                    className={`p-3 rounded-[10px] border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      selectedGroupId === grp.id
                        ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-white font-semibold'
                        : 'border-[var(--border-subtle)] bg-[#1A1A1A] text-[var(--text-body)] hover:border-[var(--border-field)]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: grp.color }}
                    />
                    <div className="truncate">
                      <div className="text-[13px] truncate">{grp.name_en}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-urdu" dir="auto">{grp.name_ur}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 2: Assign Almari */}
          {mode === 'assign_almari' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-body)] mb-1">
                    Select Target Almari:
                  </label>
                  <select
                    value={selectedAlmariId}
                    onChange={e => setSelectedAlmariId(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-[8px] text-[13px] text-white focus:outline-none focus:border-[var(--gold)]"
                  >
                    {almaris.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name_en} ({a.shelf_count} shelves)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-body)] mb-1">
                    Shelf Level:
                  </label>
                  <select
                    value={selectedShelfNo}
                    onChange={e => setSelectedShelfNo(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-[8px] text-[13px] text-white focus:outline-none focus:border-[var(--gold)]"
                  >
                    {Array.from(
                      { length: almaris.find(a => a.id === selectedAlmariId)?.shelf_count || 5 },
                      (_, i) => i + 1
                    ).map(s => (
                      <option key={s} value={s}>
                        Shelf {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-[10px] text-[12px] text-[var(--text-muted)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span>Every move will be safely recorded in the book location audit history.</span>
              </div>
            </div>
          )}

          {/* Mode 3: Suggest Almari for all unassigned */}
          {mode === 'suggest_all_unassigned' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-muted)]">
                  {previewRows.length} unassigned book(s) analyzed. Check the rows to apply:
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[var(--gold-text)] hover:underline font-semibold"
                >
                  {checkedIds.size === previewRows.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-[var(--border-subtle)] rounded-[10px] max-h-80 overflow-y-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#1A1A1A] sticky top-0 border-b border-[var(--border-subtle)] text-[11px] uppercase font-semibold text-[var(--text-muted)]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={checkedIds.size === previewRows.length && previewRows.length > 0}
                          onChange={toggleAll}
                          className="accent-[var(--gold)]"
                        />
                      </th>
                      <th className="p-2.5">Title & Author</th>
                      <th className="p-2.5">Group</th>
                      <th className="p-2.5">Suggested Almari & Shelf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {previewRows.map(row => (
                      <tr key={row.book.id} className="hover:bg-white/5">
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={checkedIds.has(row.book.id)}
                            onChange={() => toggleCheck(row.book.id)}
                            className="accent-[var(--gold)]"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-white truncate max-w-xs">{row.book.book_name}</div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate max-w-xs">{row.book.author}</div>
                        </td>
                        <td className="p-2.5">
                          {row.group ? (
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1"
                              style={{
                                backgroundColor: `${row.group.color}15`,
                                borderColor: `${row.group.color}40`,
                                color: row.group.color,
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.group.color }} />
                              {row.group.name_en}
                            </span>
                          ) : (
                            <span className="text-amber-400 italic">No group</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono">
                          {row.suggestedAlmari ? (
                            <span className="text-emerald-400 font-semibold">
                              {row.suggestedAlmari.code}, Shelf {row.suggestedShelf}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">No matching Almari</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[var(--text-muted)] italic">
                          All cataloged books are currently assigned to an Almari.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2B2730] hover:bg-[#3F3B45] text-[var(--text-body)] text-[13px] font-medium rounded-[8px]"
          >
            Cancel
          </button>
          {mode === 'assign_group' && (
            <button
              onClick={handleApplyGroup}
              className="px-5 py-2 bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-[#1A1A1A] text-[13px] font-semibold rounded-[8px] cursor-pointer shadow-sm"
            >
              Assign Group
            </button>
          )}
          {mode === 'assign_almari' && (
            <button
              onClick={handleApplyAlmari}
              className="px-5 py-2 bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-[#1A1A1A] text-[13px] font-semibold rounded-[8px] cursor-pointer shadow-sm"
            >
              Assign to Almari
            </button>
          )}
          {mode === 'suggest_all_unassigned' && (
            <button
              onClick={handleApplySuggestions}
              disabled={checkedIds.size === 0}
              className="px-5 py-2 bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-[#1A1A1A] text-[13px] font-semibold rounded-[8px] disabled:opacity-40 cursor-pointer shadow-sm"
            >
              Apply Selected ({checkedIds.size})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
