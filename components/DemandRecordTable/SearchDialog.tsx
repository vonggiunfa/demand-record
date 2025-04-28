"use client";

import { format } from 'date-fns';
import { Loader2, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useDemandTable } from './DemandTableContext';
import { SearchType } from './types';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 提取月份格式，格式为 yyyy-MM
const extractYearMonth = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onOpenChange }) => {
  const { 
    searchTerm: globalSearchTerm,
    setSearchTerm: setGlobalSearchTerm,
    searchType: globalSearchType,
    setSearchType: setGlobalSearchType,
    handleSearch,
    searchResults,
    isSearchLoading,
    loadMoreResults,
    exitSearchMode,
    setSearchResults
  } = useDemandTable();

  // 本地状态，仅在对话框内使用
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localSearchType, setLocalSearchType] = useState<SearchType>('id');

  // 当对话框打开时，重置本地状态
  useEffect(() => {
    if (open) {
      setLocalSearchTerm('');
      setLocalSearchType('id');
      // 清空全局搜索结果
      setSearchResults({ records: [], total: 0, hasMore: false });
    }
  }, [open, setSearchResults]);

  // 执行搜索
  const executeSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (localSearchTerm.trim()) {
      setGlobalSearchTerm(localSearchTerm);
      setGlobalSearchType(localSearchType);
      handleSearch(localSearchTerm, localSearchType, 0, false);
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setLocalSearchTerm('');
    // 清空搜索结果
    setSearchResults({ records: [], total: 0, hasMore: false });
  };

  // 关闭对话框时清理
  const handleClose = () => {
    onOpenChange(false);
    // 清空搜索状态
    setLocalSearchTerm('');
    setLocalSearchType('id');
    // 清空全局搜索结果
    setSearchResults({ records: [], total: 0, hasMore: false });
    // 退出搜索模式
    exitSearchMode();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">搜索</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-auto px-2">
          {/* 搜索表单 */}
          <form 
            className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10"
            onSubmit={executeSearch}
          >
            <div className="relative flex-1">
              <Input
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder="输入搜索关键词..."
                className="pr-8"
                autoFocus
              />
              {localSearchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Select
              value={localSearchType}
              onValueChange={(value) => setLocalSearchType(value as SearchType)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="搜索类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">需求ID</SelectItem>
                <SelectItem value="description">描述内容</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              type="submit" 
              size="default" 
              disabled={isSearchLoading || !localSearchTerm.trim()}
            >
              {isSearchLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-1 h-4 w-4" />
              )}
              搜索
            </Button>
          </form>

          {/* 搜索结果状态 */}
          {searchResults.total > 0 && (
            <div className="text-sm text-muted-foreground">
              找到 {searchResults.total} 条匹配记录，当前显示 {searchResults.records.length} 条
            </div>
          )}

          {/* 搜索结果表格 */}
          <div className="border rounded-md overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[150px]">需求ID</TableHead>
                  <TableHead>描述内容</TableHead>
                  <TableHead className="w-[150px]">所属月份</TableHead>
                  <TableHead className="w-[180px]">创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearchLoading && searchResults.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      <div className="mt-2 text-sm text-muted-foreground">
                        搜索中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : searchResults.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        {localSearchTerm ? '没有找到匹配的记录' : '请输入搜索条件开始搜索'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {searchResults.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.demandId || "-"}</TableCell>
                        <TableCell>{record.description || "-"}</TableCell>
                        <TableCell>
                          {/* 从创建日期中提取年月 */}
                          {extractYearMonth(record.createdAt)}
                        </TableCell>
                        <TableCell>
                          {format(record.createdAt, 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 加载更多按钮 */}
          {searchResults.hasMore && (
            <div className="flex justify-center py-2">
              <Button
                variant="outline"
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog; 