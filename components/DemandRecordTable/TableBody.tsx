"use client";

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useDemandTable } from './DemandTableContext';

const TableComponent: React.FC = () => {
  const { 
    records,
    selectedRows,
    isLoading,
    isSearchLoading,
    isSearchMode,
    searchResults,
    handleSelectAll,
    handleSelectRow,
    handleRowClick,
    handleRecordChange,
    addNewRecord,
    loadMoreResults
  } = useDemandTable();

  // 计算是否全选
  const isAllSelected = useMemo(() => {
    return records.length > 0 && selectedRows.size === records.length;
  }, [records, selectedRows]);

  return (
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
  );
};

export default TableComponent; 