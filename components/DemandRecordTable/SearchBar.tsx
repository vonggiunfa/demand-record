"use client";

import { Search } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import SearchDialog from './SearchDialog';

const SearchBar: React.FC = () => {
  // 高级搜索对话框状态
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  return (
    <>
      <div className="flex ml-auto">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSearchDialogOpen(true)}
          className="flex items-center"
          title="搜索需求"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 高级搜索对话框 */}
      <SearchDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />
    </>
  );
};

export default SearchBar; 