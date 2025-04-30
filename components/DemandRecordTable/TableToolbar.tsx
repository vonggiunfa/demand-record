"use client";

import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import React from 'react';
import MonthYearPicker from '../MonthYearPicker';
import { Button } from '../ui/button';
import CSVHandlers from './CSVHandlers';
import { useDemandTable } from './DemandTableContext';
import SearchBar from './SearchBar';

const TableToolbar: React.FC = () => {
  const { 
    addNewRecord, 
    deleteSelectedRecords, 
    saveData, 
    selectedRows, 
    hasChanges,
    isSaving,
    isSearchMode,
    currentMonth,
    handleMonthChange,
    availableMonths,
    toast
  } = useDemandTable();

  return (
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
        {/* <Button
          onClick={() => importHistoricalData(toast)}
          size="sm"
          variant="outline"
        >
          <Database className="mr-1 h-4 w-4" />
          导入历史数据
        </Button> */}
      </div>
      
      {/* 右侧工具栏 */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {/* 年月选择器 */}
        {!isSearchMode && (
          <MonthYearPicker
            value={currentMonth}
            onChange={handleMonthChange}
            availableMonths={availableMonths}
          />
        )}
        
        {/* 搜索按钮 */}
        <SearchBar />
        
        {/* CSV导入导出按钮 */}
        <CSVHandlers />
      </div>
    </div>
  );
};

export default TableToolbar; 