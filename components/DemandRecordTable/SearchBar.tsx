"use client";

import { Loader2, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useDemandTable } from './DemandTableContext';
import SearchDialog from './SearchDialog';
import { SearchType } from './types';

const SearchBar: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    searchType, 
    setSearchType, 
    executeSearch,
    isSearchLoading
  } = useDemandTable();
  
  // 高级搜索对话框状态
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  return (
    <>
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
          onValueChange={(value) => setSearchType(value as SearchType)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="搜索类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">需求ID</SelectItem>
            <SelectItem value="description">描述内容</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-1">
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
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSearchDialogOpen(true)}
          >
            高级搜索
          </Button>
        </div>
      </form>
      
      {/* 高级搜索对话框 */}
      <SearchDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />
    </>
  );
};

export default SearchBar; 