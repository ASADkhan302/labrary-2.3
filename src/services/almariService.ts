import { Book, BookGroup, Almari, AlmariGroup, BookLocationHistory } from '../types/library';
import { INITIAL_BOOK_GROUPS, INITIAL_ALMARIS, INITIAL_ALMARI_GROUPS } from './initialAlmariData';

const STORAGE_KEYS = {
  GROUPS: 'ulm_lms_book_groups_v1',
  ALMARIS: 'ulm_lms_almaris_v1',
  ALMARI_GROUPS: 'ulm_lms_almari_groups_v1',
  LOCATION_HISTORY: 'ulm_lms_location_history_v1',
};

export class AlmariService {
  private static groupsCache: BookGroup[] | null = null;
  private static almarisCache: Almari[] | null = null;
  private static almariGroupsCache: AlmariGroup[] | null = null;
  private static historyCache: BookLocationHistory[] | null = null;

  // --- GROUPS ---
  static getGroups(): BookGroup[] {
    if (this.groupsCache) return this.groupsCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (raw) {
        this.groupsCache = JSON.parse(raw);
        return this.groupsCache!;
      }
    } catch {}
    this.groupsCache = [...INITIAL_BOOK_GROUPS];
    this.saveGroups(this.groupsCache);
    return this.groupsCache;
  }

  static saveGroups(groups: BookGroup[]): void {
    this.groupsCache = groups;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }

  static addGroup(group: Omit<BookGroup, 'id'>): BookGroup {
    const groups = this.getGroups();
    const id = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newGroup: BookGroup = { ...group, id };
    groups.push(newGroup);
    this.saveGroups(groups);
    return newGroup;
  }

  static updateGroup(id: string, updates: Partial<BookGroup>): void {
    const groups = this.getGroups().map(g => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g));
    this.saveGroups(groups);
  }

  static deleteGroup(id: string): void {
    const groups = this.getGroups().filter(g => g.id !== id);
    this.saveGroups(groups);
    // Remove links in almari_groups
    const links = this.getAlmariGroups().filter(l => l.group_id !== id);
    this.saveAlmariGroups(links);
  }

  // --- ALMARIS ---
  static getAlmaris(): Almari[] {
    if (this.almarisCache) return this.almarisCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALMARIS);
      if (raw) {
        this.almarisCache = JSON.parse(raw);
        return this.almarisCache!;
      }
    } catch {}
    this.almarisCache = [...INITIAL_ALMARIS];
    this.saveAlmaris(this.almarisCache);
    return this.almarisCache;
  }

  static saveAlmaris(almaris: Almari[]): void {
    this.almarisCache = almaris;
    localStorage.setItem(STORAGE_KEYS.ALMARIS, JSON.stringify(almaris));
  }

  static addAlmari(almari: Omit<Almari, 'id'>, groupIds: string[] = []): Almari {
    const almaris = this.getAlmaris();
    const id = `alm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAlmari: Almari = { ...almari, id };
    almaris.push(newAlmari);
    this.saveAlmaris(almaris);

    if (groupIds.length > 0) {
      const links = this.getAlmariGroups();
      groupIds.forEach(gid => {
        links.push({
          id: `ag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          almari_id: id,
          group_id: gid,
        });
      });
      this.saveAlmariGroups(links);
    }
    return newAlmari;
  }

  static updateAlmari(id: string, updates: Partial<Almari>, groupIds?: string[]): void {
    const almaris = this.getAlmaris().map(a => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
    this.saveAlmaris(almaris);

    if (groupIds !== undefined) {
      const otherLinks = this.getAlmariGroups().filter(l => l.almari_id !== id);
      const newLinks = groupIds.map(gid => ({
        id: `ag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        almari_id: id,
        group_id: gid,
      }));
      this.saveAlmariGroups([...otherLinks, ...newLinks]);
    }
  }

  static deleteAlmari(id: string): void {
    const almaris = this.getAlmaris().filter(a => a.id !== id);
    this.saveAlmaris(almaris);
    const links = this.getAlmariGroups().filter(l => l.almari_id !== id);
    this.saveAlmariGroups(links);
  }

  /**
   * One-click generation: creates an almari A-01, A-02... for each active group
   * with 5 shelves and guidance capacity of 30 books per shelf.
   */
  static createAlmarisFromGroups(): Almari[] {
    const groups = this.getGroups().filter(g => g.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const existingAlmaris = this.getAlmaris();
    const newAlmaris: Almari[] = [];
    const newLinks: AlmariGroup[] = [...this.getAlmariGroups()];

    groups.forEach((grp, idx) => {
      const codeIndex = existingAlmaris.length + newAlmaris.length + 1;
      const code = `A-${String(codeIndex).padStart(2, '0')}`;
      const almId = `alm-gen-${Date.now()}-${idx}`;
      const alm: Almari = {
        id: almId,
        code,
        name_en: `${grp.name_en} Stacks`,
        name_ur: `${grp.name_ur} الماری`,
        shelf_count: 5,
        books_per_shelf: 30,
        notes: `Auto-created almari for group ${grp.name_en}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newAlmaris.push(alm);
      newLinks.push({
        id: `ag-gen-${Date.now()}-${idx}`,
        almari_id: almId,
        group_id: grp.id,
      });
    });

    const combined = [...existingAlmaris, ...newAlmaris];
    this.saveAlmaris(combined);
    this.saveAlmariGroups(newLinks);
    return combined;
  }

  // --- ALMARI_GROUPS (Many-to-Many) ---
  static getAlmariGroups(): AlmariGroup[] {
    if (this.almariGroupsCache) return this.almariGroupsCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ALMARI_GROUPS);
      if (raw) {
        this.almariGroupsCache = JSON.parse(raw);
        return this.almariGroupsCache!;
      }
    } catch {}
    this.almariGroupsCache = [...INITIAL_ALMARI_GROUPS];
    this.saveAlmariGroups(this.almariGroupsCache);
    return this.almariGroupsCache;
  }

  static saveAlmariGroups(links: AlmariGroup[]): void {
    this.almariGroupsCache = links;
    localStorage.setItem(STORAGE_KEYS.ALMARI_GROUPS, JSON.stringify(links));
  }

  static getGroupsForAlmari(almariId: string): BookGroup[] {
    const links = this.getAlmariGroups().filter(l => l.almari_id === almariId);
    const groupIds = new Set(links.map(l => l.group_id));
    return this.getGroups().filter(g => groupIds.has(g.id));
  }

  static getAlmarisForGroup(groupId: string): Almari[] {
    const links = this.getAlmariGroups().filter(l => l.group_id === groupId);
    const almariIds = new Set(links.map(l => l.almari_id));
    return this.getAlmaris().filter(a => almariIds.has(a.id));
  }

  // --- LOCATION HISTORY ---
  static getLocationHistory(): BookLocationHistory[] {
    if (this.historyCache) return this.historyCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
      if (raw) {
        this.historyCache = JSON.parse(raw);
        return this.historyCache!;
      }
    } catch {}
    this.historyCache = [];
    return this.historyCache;
  }

  static recordMove(entry: Omit<BookLocationHistory, 'id' | 'moved_at'>): void {
    const list = this.getLocationHistory();
    const newEntry: BookLocationHistory = {
      ...entry,
      id: `lh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moved_at: new Date().toISOString(),
    };
    list.unshift(newEntry);
    this.historyCache = list.slice(0, 2000); // retain last 2000 movements
    localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(this.historyCache));
  }

  static getHistoryForBook(bookId: string): BookLocationHistory[] {
    return this.getLocationHistory().filter(h => h.book_id === bookId);
  }

  // --- AUTO-SUGGESTION ENGINE ---
  /**
   * Suggests the group based on suggestion rules:
   * 1. match_language (if language matches)
   * 2. match_category (if category matches)
   * First matching group in the sort_order wins.
   */
  static suggestGroup(book: { category?: string; language?: string; book_name?: string }): BookGroup | null {
    const groups = this.getGroups().filter(g => g.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const lang = (book.language || '').trim().toLowerCase();
    const cat = (book.category || '').trim().toLowerCase();

    for (const grp of groups) {
      if (grp.match_language && grp.match_language.trim().toLowerCase() === lang) {
        return grp;
      }
      if (grp.match_category && grp.match_category.trim().toLowerCase() === cat) {
        return grp;
      }
    }

    // Secondary fallback: check language group keywords
    for (const grp of groups) {
      if (grp.match_language) {
        const ml = grp.match_language.toLowerCase();
        if (lang.includes(ml) || cat.includes(ml)) return grp;
      }
    }

    // Tertiary fallback: category partial match
    for (const grp of groups) {
      if (grp.match_category) {
        const mc = grp.match_category.toLowerCase();
        if (cat.includes(mc)) return grp;
      }
    }

    // Fallback: Other or General Reference
    const other = groups.find(g => g.name_en === 'Other') || groups.find(g => g.name_en === 'General Reference');
    return other || groups[0] || null;
  }

  /**
   * Suggests Almari and shelf for a book based on its group and current book capacity
   */
  static suggestAlmariAndShelf(groupId: string, allBooks: Book[]): { almari: Almari; shelf_no: number } | null {
    const candidateAlmaris = this.getAlmarisForGroup(groupId).filter(a => a.is_active);
    if (candidateAlmaris.length === 0) return null;

    // Tally book counts per (almari_id, shelf_no)
    const shelfCounts: Record<string, number> = {};
    for (const b of allBooks) {
      if (b.almari_id && b.shelf_no) {
        const key = `${b.almari_id}:${b.shelf_no}`;
        shelfCounts[key] = (shelfCounts[key] || 0) + 1;
      }
    }

    // Find first almari and lowest shelf with space
    for (const alm of candidateAlmaris) {
      const cap = alm.books_per_shelf || 30;
      for (let s = 1; s <= alm.shelf_count; s++) {
        const key = `${alm.id}:${s}`;
        const count = shelfCounts[key] || 0;
        if (count < cap) {
          return { almari: alm, shelf_no: s };
        }
      }
    }

    // If all shelves at or above guidance capacity, pick almari with least load on last shelf
    const firstAlm = candidateAlmaris[0];
    return { almari: firstAlm, shelf_no: 1 };
  }

  // --- SAFE MIGRATION HELPER ---
  /**
   * Performs safe, versioned migration on books array:
   * - Assigns group_id based on category match or rule
   * - Parses almari_id and shelf_no from existing shelf string (e.g. "CS-Rack-01" -> A-01, shelf 1)
   * - Never destroys data
   */
  static migrateBooksWithGroupsAndAlmaris(books: Book[]): { migrated: Book[]; changesCount: number } {
    const groups = this.getGroups();
    const almaris = this.getAlmaris();
    let changesCount = 0;

    const migrated = books.map(book => {
      let changed = false;
      let group_id = book.group_id;
      let almari_id = book.almari_id;
      let shelf_no = book.shelf_no;

      // 1. Group migration
      if (!group_id) {
        const suggested = this.suggestGroup(book);
        if (suggested) {
          group_id = suggested.id;
          changed = true;
        }
      }

      // 2. Almari and shelf migration from old shelf text
      if (!almari_id && book.shelf) {
        const shelfStr = book.shelf.toUpperCase();
        // Check if matches an almari code
        const matchedAlm = almaris.find(a => shelfStr.includes(a.code.toUpperCase()));
        if (matchedAlm) {
          almari_id = matchedAlm.id;
          shelf_no = 1;
          changed = true;
        } else if (shelfStr.includes('CS-RACK')) {
          const num = parseInt((shelfStr.match(/\d+/) || ['1'])[0], 10);
          almari_id = almaris.find(a => a.code === 'A-01')?.id || null;
          shelf_no = Math.min(Math.max(1, num), 5);
          changed = true;
        } else if (shelfStr.includes('URDU') || shelfStr.includes('PASHTO')) {
          almari_id = almaris.find(a => a.code === 'A-06')?.id || null;
          shelf_no = 1;
          changed = true;
        } else if (shelfStr.includes('MATH')) {
          almari_id = almaris.find(a => a.code === 'A-02')?.id || null;
          shelf_no = 1;
          changed = true;
        }
      }

      if (changed) {
        changesCount++;
        return {
          ...book,
          group_id: group_id || null,
          almari_id: almari_id || null,
          shelf_no: shelf_no || null,
        };
      }
      return book;
    });

    return { migrated, changesCount };
  }
}
