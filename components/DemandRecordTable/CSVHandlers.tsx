"use client";

import { DemandRecord } from '@/types/demand';
import { format } from 'date-fns';
import { FileDown, FileUp } from 'lucide-react';
import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/button';
import { useDemandTable } from './DemandTableContext';

const CSVHandlers: React.FC = () => {
  const {
    records,
    selectedRows,
    currentMonth,
    setRecords,
    setHasChanges,
    hasChanges,
    setPendingAction,
    setConfirmDialogOpen,
    toast
  } = useDemandTable();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
            
            // 添加导入成功的toast提示
            toast({
              title: "导入成功",
              description: `已导入 ${importedRecords.length} 条记录，请保存以持久化数据`,
              variant: "success"
            });
          }
        } else {
          // 添加无数据导入的toast提示
          toast({
            title: "导入提示",
            description: "CSV文件中没有有效的记录数据",
            variant: "warning"
          });
        }
      } catch (error) {
        console.error('解析CSV文件失败:', error);
        // 添加导入失败的toast提示
        toast({
          title: "导入失败",
          description: error instanceof Error ? error.message : "解析CSV文件时出错",
          variant: "destructive"
        });
      }
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  }, [records, hasChanges, setRecords, setHasChanges, setPendingAction, setConfirmDialogOpen, toast]);

  // 导出为CSV
  const handleExportCSV = useCallback(() => {
    // 确定要导出的记录
    const recordsToExport = selectedRows.size > 0
      ? records.filter(r => selectedRows.has(r.id))
      : records;
    
    if (recordsToExport.length === 0) {
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
    
    // 添加导出成功的toast提示
    toast({
      title: "导出成功",
      description: `已导出 ${recordsToExport.length} 条记录到CSV文件`,
      variant: "success"
    });
    
    // 释放URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [records, selectedRows, currentMonth, toast]);

  return (
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
  );
};

export default CSVHandlers; 