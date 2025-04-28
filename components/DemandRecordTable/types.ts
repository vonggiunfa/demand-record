import { DemandRecord } from '@/types/demand';

// 搜索结果类型
export interface SearchResult {
  records: DemandRecord[];
  total: number;
  hasMore: boolean;
}

// 待处理操作类型
export interface PendingAction {
  action: 'changeMonth' | 'importCSV';
  data?: any;
}

// 搜索类型
export type SearchType = 'id' | 'description';

// 组件之间共享的上下文类型
export interface DemandTableContextType {
  // 状态
  records: DemandRecord[];
  setRecords: (records: DemandRecord[]) => void;
  selectedRows: Set<string>;
  setSelectedRows: (rows: Set<string>) => void;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  hasChanges: boolean;
  setHasChanges: (changes: boolean) => void;
  availableMonths: string[];
  setAvailableMonths: (months: string[]) => void;
  confirmDialogOpen: boolean;
  setConfirmDialogOpen: (open: boolean) => void;
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
  
  // 搜索相关
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  isSearchMode: boolean;
  setIsSearchMode: (mode: boolean) => void;
  searchResults: SearchResult;
  setSearchResults: (results: SearchResult) => void;
  searchOffset: number;
  setSearchOffset: (offset: number) => void;
  isSearchLoading: boolean;
  setIsSearchLoading: (loading: boolean) => void;
  
  // 操作方法
  loadData: (month: string) => Promise<void>;
  saveData: () => Promise<void>;
  loadAvailableMonths: () => Promise<void>;
  addNewRecord: () => void;
  deleteSelectedRecords: () => void;
  handleRecordChange: (id: string, field: keyof DemandRecord, value: any) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectRow: (id: string, checked: boolean) => void;
  handleRowClick: (id: string, event: React.MouseEvent) => void;
  handleMonthChange: (newMonth: string) => void;
  handleSearch: (term: string, type: SearchType, offset?: number, shouldEnterSearchMode?: boolean) => Promise<void>;
  executeSearch: (e?: React.FormEvent) => void;
  exitSearchMode: () => void;
  loadMoreResults: () => void;
  confirmPendingAction: () => void;
}

// API 基础路径
export const API_BASE_PATH = '/demand-record'; 