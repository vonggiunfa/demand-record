"use client";

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '../ui/alert-dialog';
import { useDemandTable } from './DemandTableContext';

const ConfirmDialog: React.FC = () => {
  const { 
    confirmDialogOpen, 
    setConfirmDialogOpen,
    pendingAction,
    confirmPendingAction
  } = useDemandTable();

  const getActionDescription = () => {
    if (!pendingAction) return '执行此操作';
    
    switch (pendingAction.action) {
      case 'changeMonth':
        return '切换月份';
      case 'importCSV':
        return '导入数据';
      default:
        return '执行此操作';
    }
  };

  return (
    <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>你有未保存的更改</AlertDialogTitle>
          <AlertDialogDescription>
            当前有未保存的更改，{getActionDescription()}将丢失这些更改。是否继续？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={confirmPendingAction}>继续</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog; 