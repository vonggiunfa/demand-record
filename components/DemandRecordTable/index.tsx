"use client";

import React, { useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { DemandTableProvider, useDemandTable } from './DemandTableContext';
import TableComponent from './TableBody';
import TableHeader from './TableHeader';
import TableToolbar from './TableToolbar';

// 内部组件，会在提供者内部使用
const DemandTableContent: React.FC = () => {
  const { loadData, currentMonth, loadAvailableMonths } = useDemandTable();

  // 初始加载
  useEffect(() => {
    loadData(currentMonth);
    loadAvailableMonths();
  }, [currentMonth, loadData, loadAvailableMonths]);

  return (
    <div className="space-y-4">
      <TableToolbar />
      <TableHeader />
      <TableComponent />
      <ConfirmDialog />
    </div>
  );
};

// 包含了上下文提供者的主组件
const DemandRecordTable: React.FC = () => {
  return (
    <DemandTableProvider>
      <DemandTableContent />
    </DemandTableProvider>
  );
};

export default DemandRecordTable; 