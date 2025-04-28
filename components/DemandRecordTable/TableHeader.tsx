"use client";

import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useDemandTable } from './DemandTableContext';

const TableHeader: React.FC = () => {
  const { 
    isSearchMode, 
    searchTerm, 
    searchType, 
    exitSearchMode
  } = useDemandTable();

  return (
    <div className="py-4">
      {isSearchMode ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 py-1 px-2">
              搜索: {searchType === 'id' ? '需求ID' : '描述'} = {searchTerm}
            </Badge>
            <Button 
              onClick={exitSearchMode}
              size="sm"
              variant="outline"
            >
              返回
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TableHeader; 