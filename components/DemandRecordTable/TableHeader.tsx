"use client";

import React from 'react';
import MonthYearPicker from '../MonthYearPicker';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useDemandTable } from './DemandTableContext';

const TableHeader: React.FC = () => {
  const { 
    isSearchMode,
    searchResults,
    exitSearchMode,
    currentMonth,
    handleMonthChange,
    availableMonths
  } = useDemandTable();

  return (
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
  );
};

export default TableHeader; 