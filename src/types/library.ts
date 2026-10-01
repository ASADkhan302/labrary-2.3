export interface Book {
  id: string;
  barcode: string;
  isbn: string;
  book_name: string;
  author: string;
  publisher: string;
  category: string;
  edition: string;
  publication_year: number;
  language: string;
  description: string;
  book_image_path: string;
  total_quantity: number;
  available_quantity: number;
  shelf: string;
  row: string;
  section: string;
  dewey_call_number: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type BorrowerRole = 'Student' | 'Faculty' | 'Staff';
export type BorrowerStatus = 'active' | 'suspended' | 'left';

export interface Borrower {
  id: string;
  role: BorrowerRole;
  university_id: string;
  barcode: string; // same as university_id
  name: string;
  father_name?: string; // Student only
  department: string;
  program: string; // e.g. BCS
  session?: string; // e.g. FA23
  semester?: number | null; // 1-8
  designation?: string; // Faculty/Staff only
  email?: string;
  phone: string; // Pakistani format normalized 03XX-XXXXXXX
  address?: string;
  photo_path?: string;
  photo_url?: string;
  borrow_limit: number; // Student 3, Faculty 10, Staff 5
  joined_date: string;
  valid_until?: string | null;
  status: BorrowerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;

  // Backward compatibility fields
  student_id: string;
  class_name?: string;
}

export interface Transaction {
  id: string;
  book_id: string;
  borrower_id: string;
  book_name?: string;
  borrower_name?: string;
  barcode?: string;
  student_id?: string;
  action: 'ISSUE' | 'RETURN' | 'ADD' | 'REMOVE' | 'ADJUST';
  issue_date: string;
  due_date: string;
  return_date: string | null;
  quantity: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  barcode: string;
  book_id?: string;
  borrower_id?: string;
  user: string;
  created_at: string;
}

export interface SystemSettings {
  library_name: string;
  university_name: string;
  campus_address: string;
  phone: string;
  email: string;
  auto_submit_scan: boolean;
  scanner_sound: boolean;
  error_sound: boolean;
  db_path: string;
  wal_mode: boolean;
  station_id: string;
  fine_per_day_pkr?: number;
}

export type StorageMode = 'LOCAL_DISK' | 'USB_REMOVABLE' | 'NETWORK_SHARE' | 'BROWSER_SANDBOX';

export interface StorageLocationConfig {
  mode: StorageMode;
  folderPath: string;
  folderName: string;
  fileName: string;
  autoSaveToDisk: boolean;
  askOnStartup: boolean;
  isConfigured: boolean;
  lastSyncTimestamp?: string;
}

export type NavigationTab = 
  | 'catalog'
  | 'circulation'
  | 'borrowers'
  | 'reports'
  | 'scanner'
  | 'sqlite'
  | 'cpp_native'
  | 'excel'
  | 'settings';
