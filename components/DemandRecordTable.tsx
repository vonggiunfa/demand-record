"use client";

import { cn } from '@/lib/utils';
import { DemandRecord } from '@/types/demand';
import { format } from 'date-fns';
import {
  FileDown,
  FileUp,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MonthYearPicker from './MonthYearPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog';
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from './ui/use-toast';

// 获取API基础路径
const API_BASE_PATH = '/demand-record';

export default function DemandRecordTable() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [records, setRecords] = useState<DemandRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{action: string, data?: any} | null>(null);
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchType, setSearchType] = useState<'id' | 'description'>('id');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    records: DemandRecord[];
    total: number;
    hasMore: boolean;
  }>({ records: [], total: 0, hasMore: false });
  const [searchOffset, setSearchOffset] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const payload = {
        yearMonth: currentMonth,
        data: {
          lastUpdated: new Date().toISOString(),
          records
        }
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
          description: responseData.message || `成功保存 ${records.length} 条记录`
        });
        setHasChanges(false);
        loadAvailableMonths(); // 刷新可用月份列表
      } else {
        toast({
          title: "保存失败",
          description: responseData.message || "保存数据时出错",
          variant: "destructive"
        });
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
  }, [currentMonth, records, toast, loadAvailableMonths]);

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
  }, []);

  // 删除选中记录
  const deleteSelectedRecords = useCallback(() => {
    if (selectedRows.size === 0) return;
    
    setRecords(prev => prev.filter(record => !selectedRows.has(record.id)));
    setSelectedRows(new Set());
    setHasChanges(true);
    
    toast({
      title: "删除成功",
      description: `已删除 ${selectedRows.size} 条记录`
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

  // 处理点击行
  const handleRowClick = useCallback((id: string, event: React.MouseEvent) => {
    // 如果点击的是输入框、按钮或复选框，不触发行选择
    const target = event.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }
    
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
  const handleMonthChange = useCallback((newMonth: string) => {
    if (newMonth === currentMonth) return;
    
    if (hasChanges) {
      // 打开确认对话框
      setPendingAction({action: 'changeMonth', data: newMonth});
      setConfirmDialogOpen(true);
    } else {
      setCurrentMonth(newMonth);
      loadData(newMonth);
    }
  }, [currentMonth, hasChanges, loadData]);

  // 处理搜索
  const handleSearch = useCallback(async (term: string, type: 'id' | 'description', offset: number = 0) => {
    if (!term.trim()) {
      return;
    }
    
    setIsSearchLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE_PATH}/api/search?term=${encodeURIComponent(term)}&type=${type}&offset=${offset}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        if (offset === 0) {
          // 新搜索，替换结果
          setSearchResults({
            records: data.data.records,
            total: data.data.total,
            hasMore: data.data.hasMore
          });
          setRecords(data.data.records);
          setIsSearchMode(true);
        } else {
          // 加载更多，追加结果
          setSearchResults(prev => ({
            records: [...prev.records, ...data.data.records],
            total: data.data.total,
            hasMore: data.data.hasMore
          }));
          setRecords(prev => [...prev, ...data.data.records]);
        }
        
        setSearchOffset(offset + data.data.records.length);
      } else {
        toast({
          title: "搜索失败",
          description: data.message || "无法执行搜索",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: "搜索错误",
        description: "执行搜索时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  }, [toast]);
  
  // 执行搜索
  const executeSearch = useCallback((e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (searchTerm.trim()) {
      // 如果有未保存的更改，提示用户
      if (hasChanges) {
        setPendingAction({
          action: 'search',
          data: { term: searchTerm, type: searchType }
        });
        setConfirmDialogOpen(true);
      } else {
        handleSearch(searchTerm, searchType, 0);
      }
    }
  }, [searchTerm, searchType, hasChanges, handleSearch]);
  
  // 退出搜索模式
  const exitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setSearchTerm('');
    setSearchOffset(0);
    loadData(currentMonth);
  }, [currentMonth, loadData]);
  
  // 加载更多搜索结果
  const loadMoreResults = useCallback(() => {
    if (searchResults.hasMore && !isSearchLoading) {
      handleSearch(searchTerm, searchType, searchOffset);
    }
  }, [searchResults.hasMore, isSearchLoading, handleSearch, searchTerm, searchType, searchOffset]);

  // 确认执行待定操作
  const confirmPendingAction = useCallback(() => {
    if (!pendingAction) return;
    
    if (pendingAction.action === 'changeMonth' && pendingAction.data) {
      setCurrentMonth(pendingAction.data);
      loadData(pendingAction.data);
    } else if (pendingAction.action === 'search' && pendingAction.data) {
      const { term, type } = pendingAction.data;
      handleSearch(term, type, 0);
    }
    
    setConfirmDialogOpen(false);
    setPendingAction(null);
  }, [pendingAction, loadData, handleSearch]);

  // CSV文件导入
  const handleImportCSV = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        // 简单解析CSV（实际应用中应使用更健壮的CSV解析库）
        const lines = csvContent.split('\n');
        const header = lines[0].split(',');
        
        // 找到各列的索引
        const demandIdIndex = header.findIndex(h => h.trim().toLowerCase() === 'demandid');
        const descriptionIndex = header.findIndex(h => h.trim().toLowerCase() === 'description');
        
        if (demandIdIndex === -1 || descriptionIndex === -1) {
          throw new Error('CSV文件格式无效：缺少必要的列');
        }
        
        const importedRecords: DemandRecord[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          
          importedRecords.push({
            id: uuidv4(),
            demandId: values[demandIdIndex].trim(),
            description: values[descriptionIndex].trim(),
            createdAt: new Date()
          });
        }
        
        if (importedRecords.length > 0) {
          if (records.length > 0 && hasChanges) {
            // 打开确认对话框
            setPendingAction({action: 'importCSV', data: importedRecords});
            setConfirmDialogOpen(true);
          } else {
            setRecords(importedRecords);
            setHasChanges(true);
            toast({
              title: "导入成功",
              description: `已导入 ${importedRecords.length} 条记录`
            });
          }
        } else {
          toast({
            title: "导入失败",
            description: "CSV文件中没有有效记录",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('解析CSV文件失败:', error);
        toast({
          title: "导入失败",
          description: error instanceof Error ? error.message : "解析CSV文件失败",
          variant: "destructive"
        });
      }
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  }, [records, hasChanges, toast]);

  // 导出为CSV
  const handleExportCSV = useCallback(() => {
    // 确定要导出的记录
    const recordsToExport = selectedRows.size > 0
      ? records.filter(r => selectedRows.has(r.id))
      : records;
    
    if (recordsToExport.length === 0) {
      toast({
        title: "导出失败",
        description: "没有可导出的记录",
        variant: "destructive"
      });
      return;
    }
    
    // 创建CSV内容
    const header = 'demandId,description,createdAt\n';
    const rows = recordsToExport.map(record => {
      const demandId = record.demandId.includes(',') ? `"${record.demandId}"` : record.demandId;
      const description = record.description.includes(',') ? `"${record.description}"` : record.description;
      const createdAt = format(record.createdAt, 'yyyy-MM-dd HH:mm:ss');
      return `${demandId},${description},${createdAt}`;
    }).join('\n');
    
    const csvContent = `${header}${rows}`;
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `需求记录_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "导出成功",
      description: `已导出 ${recordsToExport.length} 条记录`
    });
  }, [records, selectedRows, currentMonth, toast]);

  // 初始加载
  useEffect(() => {
    loadData(currentMonth);
    loadAvailableMonths();
  }, [currentMonth, loadData, loadAvailableMonths]);

  // 计算是否全选
  const isAllSelected = useMemo(() => {
    return records.length > 0 && selectedRows.size === records.length;
  }, [records, selectedRows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* 左侧工具栏 */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={addNewRecord}
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增
          </Button>
          <Button
            onClick={deleteSelectedRecords}
            size="sm"
            variant="outline"
            disabled={selectedRows.size === 0}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            删除 {selectedRows.size > 0 && `(${selectedRows.size})`}
          </Button>
          <Button
            onClick={saveData}
            size="sm"
            variant={hasChanges ? "default" : "outline"}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
        
        {/* 搜索区域 */}
        <form 
          className="flex flex-wrap items-center gap-2 ml-auto"
          onSubmit={executeSearch}
        >
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索需求..."
              className="pr-8 w-[200px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Select
            value={searchType}
            onValueChange={(value) => setSearchType(value as 'id' | 'description')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="搜索类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">需求ID</SelectItem>
              <SelectItem value="description">描述内容</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            type="submit" 
            size="sm" 
            variant="secondary"
            disabled={isSearchLoading || !searchTerm.trim()}
          >
            {isSearchLoading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-1 h-4 w-4" />
            )}
            搜索
          </Button>
        </form>
        
        {/* CSV导入导出按钮 */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={handleImportCSV}
            size="sm"
            variant="outline"
          >
            <FileUp className="mr-1 h-4 w-4" />
            导入CSV
          </Button>
          <Button
            onClick={handleExportCSV}
            size="sm"
            variant="outline"
            disabled={records.length === 0}
          >
            <FileDown className="mr-1 h-4 w-4" />
            导出CSV {selectedRows.size > 0 && `(已选${selectedRows.size})`}
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
      
      {/* 年月选择器或搜索结果状态 */}
      <div className="flex items-center justify-between">
        {isSearchMode ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              搜索结果
            </Badge>
            <span className="text-sm text-muted-foreground">
              找到 {searchResults.total} 条匹配记录
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={exitSearchMode}
            >
              返回
            </Button>
          </div>
        ) : (
          <MonthYearPicker
            value={currentMonth}
            onChange={handleMonthChange}
            availableMonths={availableMonths}
          />
        )}
      </div>
      
      {/* 表格区域 */}
      <div className="border rounded-md overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[50px] sticky left-0 z-20 text-center bg-background">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={records.length === 0}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="w-[200px] text-center">需求ID</TableHead>
              <TableHead className="text-center">需求描述</TableHead>
              <TableHead className="w-[180px] text-center">创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isSearchLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="mt-2 text-sm text-muted-foreground">
                    {isSearchMode ? '搜索中...' : '加载中...'}
                  </div>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {isSearchMode ? '没有找到匹配的记录' : '暂无记录'}
                  </div>
                  {!isSearchMode && (
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={addNewRecord}
                    >
                      添加第一条记录
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {records.map((record) => {
                  const isSelected = selectedRows.has(record.id);
                  return (
                    <TableRow 
                      key={record.id}
                      className={cn(
                        "group",
                        isSelected && "bg-muted/50",
                        "cursor-pointer",
                        "hover:bg-muted/30"
                      )}
                      onClick={(e) => handleRowClick(record.id, e)}
                    >
                      <TableCell 
                        className="sticky left-0 z-10 text-center p-0"
                      >
                        <div className={cn(
                          "w-full h-full flex items-center justify-center p-4",
                        )}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSelectRow(record.id, checked === true)
                            }
                            aria-label="选择行"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSelected ? (
                          <Input
                            value={record.demandId}
                            onChange={(e) => 
                              handleRecordChange(record.id, 'demandId', e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder="输入需求ID"
                            className="text-center h-10"
                          />
                        ) : (
                          <div className="h-10 flex items-center justify-center">{record.demandId || "-"}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isSelected ? (
                          <Input
                            value={record.description}
                            onChange={(e) => 
                              handleRecordChange(record.id, 'description', e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            placeholder="输入需求描述"
                            className="text-center h-10"
                          />
                        ) : (
                          <div className="h-10 flex items-center justify-center overflow-hidden">{record.description || "-"}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {format(record.createdAt, 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* 加载更多按钮（仅在搜索模式且有更多结果时显示） */}
                {isSearchMode && searchResults.hasMore && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreResults}
                        disabled={isSearchLoading}
                      >
                        {isSearchLoading ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          '加载更多结果'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你有未保存的更改</AlertDialogTitle>
            <AlertDialogDescription>
              当前有未保存的更改，{pendingAction?.action === 'search' ? '执行搜索' : '切换月份或导入数据'}将丢失这些更改。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAction}>继续</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 