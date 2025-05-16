"use client";

import { DemandRecord } from '@/types/demand';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../ui/use-toast';
import {
  API_BASE_PATH,
  DemandTableContextType,
  PendingAction,
  SearchResult,
  SearchType
} from './types';

// 创建上下文
const DemandTableContext = createContext<DemandTableContextType | undefined>(undefined);

// 搜索常量
const SEARCH_LIMIT = 20; // 每页搜索结果数量

// 上下文提供者组件
export function DemandTableProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // 基础状态
  const [records, setRecords] = useState<DemandRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>('id');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult>({ 
    records: [], 
    total: 0, 
    hasMore: false 
  });
  const [searchOffset, setSearchOffset] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // 加载月份列表
  const loadAvailableMonths = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_PATH}/api/year-months`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableMonths(data.yearMonths);
      } else {
        console.error('加载月份列表失败:', data.error);
      }
    } catch (error) {
      console.error('获取月份列表出错:', error);
    }
  }, []);

  // 加载数据
  const loadData = useCallback(async (month: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_PATH}/api/load-data?yearMonth=${month}`);
      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setRecords(responseData.data.records);
        setHasChanges(false);
      } else {
        toast({
          title: "加载失败",
          description: responseData.message || "加载数据时出错",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast({
        title: "加载失败",
        description: "无法连接到服务器",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 保存数据
  const saveData = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // 只获取选中的记录
      const selectedRecords = records.filter(record => selectedRows.has(record.id));
      
      const payload = {
        yearMonth: currentMonth,
        data: {
          lastUpdated: new Date().toISOString(),
          records: selectedRows.size > 0 ? selectedRecords : records
        },
        onlySelected: selectedRows.size > 0
      };
      
      const response = await fetch(`${API_BASE_PATH}/api/save-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "保存成功",
          description: payload.data.records.length === 0 
            ? `已清空 ${currentMonth} 的所有记录` 
            : responseData.message || `成功保存 ${payload.data.records.length} 条记录`,
          variant: "success"
        });
        setHasChanges(false);
        setSelectedRows(new Set()); // 保存完毕后重置所有行的选中状态
        loadAvailableMonths(); // 刷新可用月份列表
      } else {
        // 处理需求ID重复的情况
        if (responseData.duplicateRecords) {
          const duplicateIDs = responseData.duplicateRecords.map((record: { demandId: string; description: string }) => 
            `${record.demandId}${record.description ? ` (${record.description})` : ''}`
          ).join(', ');
          
          toast({
            title: "保存失败",
            description: `部分需求ID已存在：${duplicateIDs}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "保存失败",
            description: responseData.message || "保存数据时出错",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('保存数据失败:', error);
      toast({
        title: "保存失败",
        description: "无法连接到服务器",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentMonth, records, selectedRows, toast, loadAvailableMonths]);

  // 添加新记录
  const addNewRecord = useCallback(() => {
    const newRecord: DemandRecord = {
      id: uuidv4(),
      demandId: '',
      description: '',
      createdAt: new Date()
    };
    
    setRecords(prev => [newRecord, ...prev]);
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.add(newRecord.id);
      return next;
    });
    setHasChanges(true);
    
    // 添加toast提示
    toast({
      title: "添加成功",
      description: "已添加新记录，请填写内容后保存",
      variant: "success"
    });
  }, [toast]);

  // 删除选中记录
  const deleteSelectedRecords = useCallback(() => {
    if (selectedRows.size === 0) return;
    
    // 保存当前选中行数到本地变量
    const deletedCount = selectedRows.size;
    
    setRecords(prev => prev.filter(record => !selectedRows.has(record.id)));
    setSelectedRows(new Set());
    setHasChanges(true);
    
    toast({
      title: "删除成功",
      description: `已删除 ${deletedCount} 条记录`,
      variant: "success"
    });
  }, [selectedRows, toast]);

  // 处理记录字段变更
  const handleRecordChange = useCallback((id: string, field: keyof DemandRecord, value: any) => {
    setRecords(prev => prev.map(record => 
      record.id === id ? { ...record, [field]: value } : record
    ));
    setHasChanges(true);
  }, []);

  // 处理全选/取消全选
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(records.map(record => record.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  }, [records]);

  // 处理选择单行
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // 处理行点击
  const handleRowClick = useCallback((id: string, event: React.MouseEvent) => {
    // 如果点击的是复选框或输入框，不处理行点击事件
    if (
      (event.target as HTMLElement).tagName === 'INPUT' ||
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('input')
    ) {
      return;
    }
    
    // 否则切换行选中状态
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 处理月份变更
  const handleMonthChange = useCallback((month: string) => {
    if (hasChanges) {
      // 有未保存的更改，打开确认对话框
      setPendingAction({
        action: 'changeMonth',
        data: month
      });
      setConfirmDialogOpen(true);
    } else {
      // 没有未保存的更改，直接切换月份
      setCurrentMonth(month);
      loadData(month);
    }
  }, [hasChanges, loadData]);

  // 基础搜索逻辑已移除，由高级搜索对话框完全接管
  const executeSearch = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // 此方法保留用于类型兼容性，但不再提供实际功能
    // 所有搜索功能已集中到高级搜索对话框中
  }, []);

  // 搜索上下文，通过API搜索所有月份数据
  const handleSearch = useCallback(async (term: string, type: SearchType, offset: number = 0, shouldEnterSearchMode: boolean = false) => {
    if (!term.trim()) return;
    
    setIsSearchLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE_PATH}/api/search?term=${encodeURIComponent(term)}&type=${type}&offset=${offset}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        if (offset === 0) {
          // 清空当前结果，显示新结果
          setSearchResults(data.data);
        } else {
          // 追加到当前结果
          setSearchResults(prev => ({
            records: [...prev.records, ...data.data.records],
            total: data.data.total,
            hasMore: data.data.hasMore
          }));
        }
        
        setSearchOffset(offset + data.data.records.length);
        
        // 由调用者控制是否进入搜索模式，默认不进入
        if (shouldEnterSearchMode) {
          setIsSearchMode(true);
        }
      } else {
        toast({
          title: "搜索失败",
          description: data.message || "执行搜索时出错",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: "搜索失败",
        description: "无法连接到服务器",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  }, [toast]);

  // 加载更多搜索结果
  const loadMoreResults = useCallback(async () => {
    if (!isSearchMode || !searchResults.hasMore || isSearchLoading) return;
    
    setIsSearchLoading(true);
    
    try {
      // 计算新的偏移量
      const newOffset = searchOffset + SEARCH_LIMIT;
      setSearchOffset(newOffset);
      
      await handleSearch(searchTerm, searchType, newOffset, false);
    } catch (error) {
      console.error('加载更多搜索结果失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载更多搜索结果",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  }, [isSearchMode, searchResults.hasMore, isSearchLoading, searchOffset, searchTerm, searchType, handleSearch, toast, setSearchOffset, setIsSearchLoading]);

  // 退出搜索模式
  const exitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults({ records: [], total: 0, hasMore: false });
    setSearchOffset(0);
  }, []);

  // 确认待执行操作
  const confirmPendingAction = useCallback(() => {
    if (!pendingAction) return;
    
    setConfirmDialogOpen(false);
    
    switch (pendingAction.action) {
      case 'changeMonth':
        // 切换月份
        const month = pendingAction.data as string;
        setCurrentMonth(month);
        loadData(month);
        break;
    }
    
    setPendingAction(null);
  }, [pendingAction, loadData, setCurrentMonth]);

  // 处理复制需求记录
  const handleCopyRecord = useCallback((record: DemandRecord) => {
    // 拼接需求id和需求描述为模板：【需求id】需求描述
    const copyText = `【${record.demandId}】${record.description}`;
    
    // 检查clipboard API是否可用
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 使用Clipboard API复制到剪贴板
      navigator.clipboard.writeText(copyText)
        .then(() => {
          toast({
            title: "复制成功",
            description: "已复制到剪贴板",
            variant: "success"
          });
        })
        .catch((error) => {
          console.error('复制到剪贴板失败:', error);
          // 尝试使用备用方法
          fallbackCopyToClipboard(copyText);
        });
    } else {
      // 使用备用方法
      fallbackCopyToClipboard(copyText);
    }
    
    // 备用复制方法
    function fallbackCopyToClipboard(text: string) {
      try {
        // 创建临时textarea元素
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // 确保textarea不会显示在视口中
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast({
            title: "复制成功",
            description: "已复制到剪贴板",
            variant: "success"
          });
        } else {
          throw new Error('复制命令执行失败');
        }
      } catch (error) {
        console.error('备用复制方法失败:', error);
        toast({
          title: "复制失败",
          description: "无法访问剪贴板，请手动复制",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  // 上下文值对象
  const contextValue: DemandTableContextType = {
    // 数据状态
    records,
    setRecords,
    selectedRows,
    setSelectedRows,
    currentMonth,
    setCurrentMonth,
    isLoading,
    setIsLoading,
    isSaving, 
    setIsSaving,
    hasChanges,
    setHasChanges,
    availableMonths,
    setAvailableMonths,
    confirmDialogOpen,
    setConfirmDialogOpen,
    pendingAction,
    setPendingAction,
    
    // 通知相关
    toast,
    
    // 搜索状态
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    isSearchMode,
    setIsSearchMode,
    searchResults,
    setSearchResults,
    isSearchLoading,
    setIsSearchLoading,
    searchOffset,
    setSearchOffset,
    
    // 方法
    loadData,
    loadAvailableMonths,
    saveData,
    addNewRecord,
    deleteSelectedRecords,
    handleRecordChange,
    handleSelectAll,
    handleSelectRow,
    handleRowClick,
    handleMonthChange,
    executeSearch,
    handleSearch,
    exitSearchMode,
    loadMoreResults,
    confirmPendingAction,
    handleCopyRecord
  };

  return (
    <DemandTableContext.Provider value={contextValue}>
      {children}
    </DemandTableContext.Provider>
  );
}

// 自定义钩子，用于访问上下文
export function useDemandTable() {
  const context = useContext(DemandTableContext);
  
  if (context === undefined) {
    throw new Error('useDemandTable must be used within a DemandTableProvider');
  }
  
  return context;
} 