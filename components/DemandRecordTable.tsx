"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Download, Plus, Save, Trash2, Upload } from 'lucide-react';
import React, { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import MonthYearPicker from './MonthYearPicker';

// 定义数据类型
interface DemandRecord {
  id: string;
  demandId: string;
  description: string;
  createdAt: Date;
}

// 定义列类型
interface ColumnType {
  title: string;
  dataIndex: string;
  key: string;
  isReadOnly: boolean;
  width: string;
  minWidth: string;
}

// 定义表格列配置
const columns: ColumnType[] = [
  {
    title: '选择',
    dataIndex: 'select',
    key: 'select',
    isReadOnly: true,
    width: '40px',
    minWidth: '40px',
  },
  {
    title: '需求ID',
    dataIndex: 'demandId',
    key: 'demandId',
    isReadOnly: false,
    width: '150px',
    minWidth: '150px',
  },
  {
    title: '需求描述',
    dataIndex: 'description',
    key: 'description',
    isReadOnly: false,
    width: '1fr',
    minWidth: '300px',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    isReadOnly: true,
    width: '180px',
    minWidth: '180px',
  }
]

// 生成唯一ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
}

// 创建初始数据行
const createInitialRow = (): DemandRecord => ({
  id: generateId(),
  demandId: '',
  description: '',
  createdAt: new Date(),
})

// 创建行组件 - 使用React.memo优化渲染性能
const TableRow = React.memo(({
  row,
  columns,
  isSelected,
  onRowSelect,
  onInputChange,
  onDateChange,
  onKeyDown,
  getCellContent,
}: {
  row: DemandRecord;
  columns: ColumnType[];
  isSelected: boolean;
  onRowSelect: (rowId: string, checked: boolean) => void;
  onInputChange: (rowId: string, key: string, value: string) => void;
  onDateChange: (rowId: string, date: Date | undefined) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, rowId: string, columnIndex: number) => void;
  getCellContent: (row: DemandRecord, column: ColumnType, rowIndex: number, colIndex: number, isEditable: boolean) => React.ReactNode;
}) => {
  return (
    <tr className={isSelected ? 'selected' : ''}>
      {columns.map((column, colIndex) => (
        <td
          key={`${row.id}_${column.key}`}
          className={`
            ${column.dataIndex === 'select' ? 'w-10 p-0' : ''}
            ${colIndex === 0 ? 'sticky-left' : ''}
          `}
        >
          {getCellContent(row, column, 0, colIndex, isSelected)}
        </td>
      ))}
    </tr>
  );
});

/**
 * 获取API基础路径
 * 根据运行环境自动确定正确的基础路径
 */
const getApiBasePath = (): string => {
  // 如果在客户端，获取当前路径的基础部分
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    // 检查路径是否包含basePath
    if (pathParts.length > 1 && pathParts[1] === 'demand-record') {
      return '/demand-record';
    }
  }
  
  // 无法确定时，使用已知的basePath
  return '/demand-record';
};

/**
 * DemandRecordTable - 需求记录表格组件
 * 
 * 功能：
 * 1. 需求记录的增删改查
 * 2. 支持选择行进行批量操作
 * 3. 支持导入导出CSV数据
 * 4. 只有选中行才能编辑需求ID和描述
 * 5. 支持保存数据到本地JSON文件，按月份组织
 * 6. 支持按年月筛选需求数据
 */
const DemandRecordTable = () => {
  const [rows, setRows] = useState<DemandRecord[]>([])
  const [isClient, setIsClient] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiBasePath, setApiBasePath] = useState('/demand-record')
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const inputRefs = useRef<{[key: string]: HTMLInputElement | HTMLTextAreaElement | null}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  // 在客户端初始化时设置正确的API基础路径
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detectedPath = getApiBasePath();
      console.log('检测到的API基础路径:', detectedPath, '当前URL:', window.location.href);
      setApiBasePath(detectedPath);
    }
  }, []);

  // 使用useCallback优化事件处理函数
  
  // 处理输入变化
  const handleInputChange = useCallback((rowId: string, key: string, value: string) => {
    // 只处理选中行的输入
    if (selectedRows.has(rowId)) {
      setRows(prevRows => {
        return prevRows.map(row => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            [key]: value
          };
        });
      });
    }
  }, [selectedRows]);

  // 当日期变化时更新日期
  const handleDateChange = useCallback((rowId: string, date: Date | undefined) => {
    // 不执行任何操作，因为创建时间不可编辑
  }, []);

  // 处理键盘导航
  const handleKeyDown = useCallback((
    e: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, 
    rowId: string, 
    currentIndex: number
  ) => {
    // 只处理选中行
    if (!selectedRows.has(rowId)) return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // 获取下一个可编辑列的索引
      const editableColumns = columns
        .filter(col => !col.isReadOnly && col.dataIndex !== 'select')
        .map(col => col.dataIndex);
      
      const currentColumnIndex = editableColumns.findIndex(
        dataIndex => dataIndex === columns[currentIndex].dataIndex
      );
      
      const nextColumnIndex = (currentColumnIndex + 1) % editableColumns.length;
      const nextColumn = editableColumns[nextColumnIndex];
      
      // 聚焦到下一个输入框
      inputRefs.current[`${rowId}_${nextColumn}`]?.focus();
    }
  }, [selectedRows]);

  // 处理行选择
  const handleRowSelect = useCallback((rowId: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(rowId);
      } else {
        newSelected.delete(rowId);
      }
      return newSelected;
    });
  }, []);

  // 处理全选
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // 全选
      const allIds = rows.map(row => row.id);
      setSelectedRows(new Set(allIds));
    } else {
      // 取消全选
      setSelectedRows(new Set());
    }
  }, [rows]);

  // 添加新行
  const addRow = useCallback(() => {
    const newRow = createInitialRow();
    setRows(prevRows => [...prevRows, newRow]);
    
    // 自动选中新行
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      newSelected.add(newRow.id);
      return newSelected;
    });
    
    // 延迟执行滚动操作，确保新行已渲染到DOM中
    setTimeout(() => {
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.scrollTop = tableContainer.scrollHeight;
      }
    }, 50);
  }, []);

  // 删除选中行
  const deleteSelectedRows = useCallback(() => {
    if (selectedRows.size === 0) {
      toast.error('请先选择要删除的行');
      return;
    }
    
    setRows(prevRows => prevRows.filter(row => !selectedRows.has(row.id)));
    setSelectedRows(new Set()); // 清空选择
    setSelectAll(false);
    toast.success(`已删除 ${selectedRows.size} 行数据`);
  }, [selectedRows]);

  // 导出CSV文件 - 选中行或全部
  const exportCSV = useCallback(() => {
    try {
      // 获取要导出的行
      const rowsToExport = selectedRows.size > 0 
        ? rows.filter(row => selectedRows.has(row.id))
        : rows;
        
      if (rowsToExport.length === 0) {
        toast.error('没有可导出的数据');
        return;
      }
        
      // 表头行
      const headers = columns
        .filter((col) => col.dataIndex !== 'select')
        .map((col) => col.title)
        .join(',');
      
      // 数据行
      const dataRows = rowsToExport.map(row => {
        return columns
          .filter((col) => col.dataIndex !== 'select')
          .map((col) => {
            if (col.dataIndex === 'createdAt') {
              return format(row.createdAt, 'yyyy-MM-dd HH:mm:ss');
            }
            
            // 对描述字段特殊处理，确保CSV格式正确
            if (col.dataIndex === 'description') {
              // 处理可能包含逗号、引号和换行符的描述文本
              const value = String(row[col.dataIndex as keyof DemandRecord] || '');
              // 如果包含逗号、双引号或换行符，需要用双引号包裹并处理内部的双引号
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }
            
            return row[col.dataIndex as keyof DemandRecord] || '';
          })
          .join(',');
      }).join('\n');
      
      // 创建CSV内容
      const csvContent = `${headers}\n${dataRows}`;
      
      // 创建Blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // 设置下载属性
      link.setAttribute('href', url);
      link.setAttribute('download', `需求记录_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      // 隐藏链接并添加到DOM
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      
      // 触发下载
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`成功导出 ${rowsToExport.length} 行数据`);
    } catch (error) {
      console.error('Error exporting data', error);
      toast.error('导出失败');
    }
  }, [rows, selectedRows, columns]);

  // 处理CSV文件导入
  const handleImportCSV = useCallback(() => {
    // 触发文件选择对话框
    fileInputRef.current?.click();
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('未选择文件');
      return;
    }

    // 检查文件类型
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('请选择CSV格式的文件');
      event.target.value = ''; // 重置input
      return;
    }

    // 创建文件读取器
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          toast.error('文件内容为空');
          return;
        }
        
        // 解析CSV数据
        parseCSVData(csvContent);
      } catch (error) {
        console.error('导入文件时发生错误', error);
        toast.error('导入失败，文件格式错误');
      } finally {
        // 重置文件输入框
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      toast.error('读取文件时发生错误');
      event.target.value = '';
    };
    
    // 读取文件内容
    reader.readAsText(file);
  }, []);

  // 解析CSV数据并转换为表格数据
  const parseCSVData = useCallback((csvContent: string) => {
    try {
      // 分割为行，处理Windows和Unix换行符
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        toast.error('CSV文件格式无效，至少需要表头和一行数据');
        return;
      }
      
      // 获取表头行
      const headers = parseCSVLine(lines[0]);
      
      // 验证CSV格式是否与表格格式匹配
      const expectedHeaders = columns
        .filter((col) => col.dataIndex !== 'select')
        .map((col) => col.title);
      
      // 检查必要的列是否存在
      const hasRequiredHeaders = expectedHeaders.every((header) => 
        headers.includes(header)
      );
      
      if (!hasRequiredHeaders) {
        toast.error('CSV文件格式与表格不匹配，请使用导出功能导出的CSV文件');
        return;
      }
      
      // 确认是否要替换现有数据
      if (rows.length > 0) {  // 只有当已有数据时才询问是否替换
        if (!window.confirm('这将替换当前所有数据，确定要继续吗？')) {
          return;
        }
      }
      
      // 解析数据行
      const newRows: DemandRecord[] = [];
      
      // 从第二行开始解析数据
      for (let i = 1; i < lines.length; i++) {
        // 解析CSV行，处理引号内的逗号
        const values = parseCSVLine(lines[i]);
        
        // 跳过空行或格式不正确的行
        if (values.length !== headers.length) continue;
        
        // 创建新的数据行
        const newRow: any = createInitialRow();
        
        // 映射CSV数据到表格数据
        columns.forEach((column) => {
          if (column.dataIndex === 'select') return;
          
          const headerIndex = headers.findIndex(h => h === column.title);
          if (headerIndex === -1) return;
          
          const value = values[headerIndex];
          
          // 特殊处理日期
          if (column.dataIndex === 'createdAt') {
            try {
              // 支持多种日期格式
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                newRow.createdAt = dateValue;
              } else {
                newRow.createdAt = new Date(); // 默认为当前日期
              }
            } catch (dateError) {
              console.warn('日期解析错误', dateError);
              newRow.createdAt = new Date(); // 默认为当前日期
            }
          } else {
            // 处理其他列的数据
            newRow[column.dataIndex as keyof DemandRecord] = value || '';
          }
        });
        
        // 添加到新行数组
        newRows.push(newRow);
      }
      
      if (newRows.length === 0) {
        toast.error('未找到有效数据行');
        return;
      }
      
      // 更新状态
      setRows(newRows);
      toast.success(`成功导入 ${newRows.length} 行数据`);
    } catch (error) {
      console.error('解析CSV数据时发生错误', error);
      toast.error('解析CSV文件失败');
    }
  }, [rows.length, columns]);

  // 解析CSV行，处理引号内的逗号
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // 处理双引号
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // 双引号内的转义引号 ("") 
          current += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 非引号内的逗号，分割字段
        result.push(current);
        current = '';
      } else {
        // 普通字符
        current += char;
      }
    }
    
    // 添加最后一个字段
    result.push(current);
    
    return result;
  };

  // 获取单元格内容 - 根据选中状态决定是否可编辑
  const getCellContent = useCallback((
    row: DemandRecord, 
    column: ColumnType, 
    rowIndex: number, 
    colIndex: number, 
    isEditable: boolean
  ) => {
    // 选择列 - 多选框
    if (column.dataIndex === 'select') {
      return (
        <div className="flex justify-center items-center w-full h-full">
          <Checkbox 
            checked={selectedRows.has(row.id)} 
            onCheckedChange={(checked) => handleRowSelect(row.id, checked === true)}
          />
        </div>
      );
    }
    
    // 创建时间列 - 只读文本
    if (column.dataIndex === 'createdAt') {
      // 只读状态 - 显示日期文本
      return (
        <div className="readonly-text">
          {row.createdAt ? format(row.createdAt, 'yyyy-MM-dd HH:mm') : ''}
        </div>
      );
    }
    
    // 需求描述列 - 输入框或只读文本
    if (column.dataIndex === 'description') {
      if (isEditable) {
        // 可编辑状态 - 显示单行输入框
        return (
          <Input
            ref={(el) => {
              inputRefs.current[`${row.id}_${column.dataIndex}`] = el;
            }}  
            value={row[column.dataIndex] || ''}
            className='text-center'
            onChange={(e) => handleInputChange(row.id, column.dataIndex, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            placeholder="请输入需求描述"
          />
        );
      } else {
        // 不可编辑状态 - 显示只读文本
        return (
          <div className="readonly-text description-text">
            {row[column.dataIndex] || ''}
          </div>
        );
      }
    }
    
    // 其他可编辑列 - 普通Input（需求ID）
    if (!column.isReadOnly) {
      if (isEditable) {
        // 可编辑状态
        return (
          <Input
            ref={(el) => {
              inputRefs.current[`${row.id}_${column.dataIndex}`] = el;
            }}
            className='text-center'
            value={row[column.dataIndex as keyof DemandRecord] as string || ''}
            onChange={(e) => handleInputChange(row.id, column.dataIndex, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
            placeholder={`请输入${column.title}`}
          />
        );
      } else {
        // 不可编辑状态
        return (
          <div className="readonly-text">
            {row[column.dataIndex as keyof DemandRecord] as string || ''}
          </div>
        );
      }
    }
    
    // 默认显示只读文本
    return (
      <div className="readonly-text">
        {row[column.dataIndex as keyof DemandRecord] as string || ''}
      </div>
    );
  }, [selectedRows, handleInputChange, handleKeyDown, handleRowSelect]);

  // 处理表格滚动状态
  useEffect(() => {
    let scrollTimer: number;
    
    const handleScroll = () => {
      const container = tableContainerRef.current;
      if (!container) return;
      
      // 判断是否向右滚动（scrollLeft > 0）
      if (container.scrollLeft > 5) {
        container.classList.add('scrolled-right');
      } else {
        container.classList.remove('scrolled-right');
      }
      
      // 添加滚动中的类，提升滚动性能
      container.classList.add('scrolling');
      
      // 清除之前的定时器
      clearTimeout(scrollTimer);
      
      // 设置新的定时器，滚动停止后移除滚动中的类
      scrollTimer = window.setTimeout(() => {
        container.classList.remove('scrolling');
      }, 150);
    };
    
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    // 清理事件监听和定时器
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(scrollTimer);
    };
  }, [isClient]);

  // 获取当前选择的月份的文件名
  const getSelectedMonthFileName = useCallback(() => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const fileName = `${year}-${month}.json`;
    console.log(`生成文件名: ${fileName}, 基于选中月份:`, selectedMonth);
    return fileName;
  }, [selectedMonth]);

  // 保存数据到JSON文件
  const saveToJsonFile = useCallback(async () => {
    if (rows.length === 0) {
      toast.error('没有数据可保存');
      return;
    }

    setIsSaving(true);
    
    try {
      // 创建要保存的数据对象
      const dataToSave = {
        lastUpdated: new Date().toISOString(),
        records: rows
      };

      const fileName = getSelectedMonthFileName();
      let apiUrl = `${apiBasePath}/api/save-data`;
      console.log(`正在保存数据到文件: ${fileName}`, {
        recordsCount: rows.length,
        apiUrl
      });

      // 首次尝试带有basePath的URL
      let response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          data: dataToSave
        }),
      });

      // 如果是404错误，尝试不带basePath的URL
      if (response.status === 404) {
        console.warn('带basePath的API路径请求失败，尝试不带basePath的路径');
        apiUrl = `/api/save-data`;
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName,
            data: dataToSave
          }),
        });
        
        // 如果成功，更新apiBasePath
        if (response.ok) {
          console.log('不带basePath的API路径请求成功，更新apiBasePath');
          setApiBasePath('');
        }
      }

      // 获取响应文本以便调试
      const responseText = await response.text();
      console.log(`服务器响应状态: ${response.status}`, responseText);
      
      let result;
      try {
        // 尝试解析JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('解析响应JSON失败:', parseError);
        throw new Error(`服务器返回了无效的JSON数据: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        const errorMessage = result?.message || '保存失败';
        const errorDetails = result?.details || '';
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }
      
      if (result.success) {
        toast.success('数据已成功保存到文件');
        console.log('保存成功，文件路径:', result.path);
      } else {
        throw new Error(result.message || '保存操作未成功完成');
      }
    } catch (error: any) {
      console.error('保存数据到文件时发生错误', error);
      toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  }, [rows, getSelectedMonthFileName, apiBasePath]);

  // 从JSON文件加载数据
  const loadFromJsonFile = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const fileName = getSelectedMonthFileName();
      // 从文件名中提取月份部分用于调试
      const monthPart = fileName.replace('.json', '');
      
      let apiUrl = `${apiBasePath}/api/load-data?fileName=${fileName}`;
      console.log(`尝试从服务器加载数据文件:`, {
        fileName,
        monthPart,
        apiUrl,
        selectedMonth
      });
      
      // 首次尝试带有basePath的URL
      let response = await fetch(apiUrl);
      
      // 如果是404错误，尝试不带basePath的URL
      if (response.status === 404) {
        // 检查一下是否是因为文件不存在，还是因为API路径问题
        const responseText = await response.text();
        try {
          // 尝试解析响应
          const result = JSON.parse(responseText);
          // 如果能解析，并且消息是"文件不存在"，那么API路径是正确的，只是文件不存在
          if (result.message === '文件不存在' || result.message === '数据目录不存在') {
            console.log('文件不存在，这是正常的');
            // 文件不存在，清空当前表格数据
            setRows([]);
            return false;
          }
        } catch (e) {
          // 解析失败，可能是API路径问题
          console.warn('带basePath的API路径请求失败，尝试不带basePath的路径');
        }
        
        // 尝试不带basePath的URL
        apiUrl = `/api/load-data?fileName=${fileName}`;
        response = await fetch(apiUrl);
        
        // 如果成功，更新apiBasePath
        if (response.ok) {
          console.log('不带basePath的API路径请求成功，更新apiBasePath');
          setApiBasePath('');
        }
      }
      
      // 如果状态码是404，说明文件不存在，这是正常的情况
      if (response.status === 404) {
        console.log('当前月份没有保存的数据');
        // 清空当前表格数据
        setRows([]);
        return false;
      }
      
      // 获取响应文本以便调试
      const responseText = await response.text();
      console.log(`服务器响应状态: ${response.status}`, responseText);
      
      let result;
      try {
        // 尝试解析JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('解析响应JSON失败:', parseError);
        // 解析失败，清空表格数据
        setRows([]);
        throw new Error(`服务器返回了无效的JSON数据: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        const errorMessage = result?.message || '加载失败';
        const errorDetails = result?.details || '';
        // API请求失败，清空表格数据
        setRows([]);
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }
      
      if (result.success && result.data) {
        // 处理日期字段
        const loadedRows = result.data.records.map((record: any) => ({
          ...record,
          createdAt: new Date(record.createdAt)
        }));
        
        console.log(`成功加载月份 [${monthPart}] 的数据: ${loadedRows.length} 条记录`);
        
        setRows(loadedRows);
        toast.success(`成功加载 ${loadedRows.length} 条数据`);
        return true;
      } else {
        // 加载不成功，清空表格数据
        setRows([]);
        throw new Error(result.message || '加载操作未成功完成');
      }
    } catch (error: any) {
      console.error('加载数据时发生错误', error);
      toast.error(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
      // 出现错误，清空表格数据
      setRows([]);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedMonthFileName, apiBasePath, setApiBasePath, selectedMonth]);

  // 处理月份选择变化
  const handleMonthChange = useCallback((date: Date) => {
    // 确保日期设置为当月的第一天
    const newDate = new Date(date);
    newDate.setDate(1);
    
    console.log(`月份选择变更: ${format(selectedMonth, 'yyyy-MM')} -> ${format(newDate, 'yyyy-MM')}`);
    
    // 只有当月份实际变化时才更新状态
    if (selectedMonth.getFullYear() !== newDate.getFullYear() || 
        selectedMonth.getMonth() !== newDate.getMonth()) {
      setSelectedMonth(newDate);
      // 清空选中行状态
      setSelectedRows(new Set());
      setSelectAll(false);
      
      // 立即清空表格数据，等待新数据加载
      setRows([]);
    }
  }, [selectedMonth]);

  // 在选择的月份变化后重新加载数据
  useEffect(() => {
    if (isClient) {
      loadFromJsonFile().catch(error => {
        console.warn('加载数据失败，这可能是正常的（如果是第一次使用）', error);
        // 确保在加载失败时也清空表格数据
        setRows([]);
      });
    }
  }, [isClient, loadFromJsonFile, selectedMonth]);

  // 当组件挂载时初始化
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 当行数据变化时，更新全选状态
  useEffect(() => {
    if (rows.length > 0 && selectedRows.size === rows.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedRows, rows])

  if (!isClient) return null

  const selectedCount = selectedRows.size
  const totalCount = rows.length
  const hasSelected = selectedCount > 0
  const hasData = rows.length > 0

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addRow}
              className="h-8"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={deleteSelectedRows}
              className="h-8 text-red-500 hover:text-red-700 border-red-300 hover:border-red-500 hover:bg-red-50"
              disabled={!hasSelected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除{hasSelected ? `(${selectedCount})` : ''}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveToJsonFile}
              className="h-8 text-green-500 hover:text-green-700 border-green-300 hover:border-green-500 hover:bg-green-50"
              disabled={!hasData || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              {hasSelected ? `已选择 ${selectedCount}/${totalCount} 行` : ''}
            </span>
          </div>
          
          {/* 添加年月选择器 */}
          <MonthYearPicker 
            value={selectedMonth}
            onChange={handleMonthChange}
          />
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImportCSV}
              className="h-8 bg-blue-100 hover:bg-blue-200 border-blue-300"
            >
              <Upload className="mr-2 h-4 w-4" />
              导入CSV
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
            />
            <Button 
              variant="default" 
              size="sm" 
              onClick={exportCSV}
              className="h-8 bg-black hover:bg-gray-800 text-white"
              disabled={!hasData}
            >
              <Download className="mr-2 h-4 w-4" />
              {hasSelected ? '导出所选' : '导出全部'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-md bg-gray-50">
            <div className="text-lg font-medium text-gray-500 mb-2">暂无数据</div>
            <div className="text-sm text-gray-400">请点击上方"新增"按钮添加需求记录</div>
          </div>
        ) : (
          <div className="w-full relative" style={{ minWidth: "100%" }}>
            <div 
              className="overflow-auto border rounded-md custom-scrollbar table-container"
              style={{
                maxHeight: '60vh',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent',
                position: 'relative'
              }}
              ref={tableContainerRef}
            >
              <style jsx global>{`
                /* 自定义滚动条样式 */
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f0f0f0;
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #9ca3af;
                  border-radius: 10px;
                  border: 2px solid transparent;
                  background-clip: content-box;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: #6b7280;
                }
                
                /* 表格基础样式 */
                .sticky-table {
                  border-collapse: separate;
                  border-spacing: 0;
                  width: 100%;
                  table-layout: fixed;
                }
                
                /* 固定表头 */
                .sticky-table thead th {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  background-color: #ffffff;
                  box-shadow: inset 0 -1px 0 #e5e7eb;
                  font-weight: 500;
                  text-align: center;
                  color: #6b7280;
                  padding: 0.75rem;
                  font-size: 0.875rem;
                  line-height: 1.25rem;
                }
                
                /* 固定列 */
                .sticky-table th.sticky-left,
                .sticky-table td.sticky-left {
                  position: sticky;
                  left: 0;
                  z-index: 5;
                  background-color: #ffffff;
                }
                
                /* 固定列与固定表头的交叉部分 */
                .sticky-table thead th.sticky-left {
                  z-index: 15;
                }
                
                /* 表格行样式 */
                .sticky-table tbody tr {
                  border-bottom: 1px solid #f0f0f0;
                  position: relative;
                }
                
                .sticky-table tbody tr:last-child {
                  border-bottom: none;
                }
                
                /* 选中行样式 */
                .sticky-table tbody tr.selected {
                  background-color: #f2f2f2;
                  transition: background-color 0.2s ease;
                }
                
                /* 固定列选中状态 */
                .sticky-table tbody tr.selected td.sticky-left {
                  background-color: #f2f2f2;
                }
                
                /* 单元格样式 */
                .sticky-table td {
                  padding: 0.5rem;
                }
                
                /* 非选中行样式 */
                .sticky-table tbody tr:not(.selected) td {
                  color: #666666;
                  transition: color 0.2s ease;
                }
                
                /* 滚动性能优化 */
                .table-container.scrolling * {
                  pointer-events: none;
                }
                
                /* 行悬浮效果 */
                .sticky-table tbody tr:hover {
                  background-color: #f8f8f8;
                  cursor: pointer;
                }
                
                /* 选中行悬浮效果 */
                .sticky-table tbody tr.selected:hover {
                  background-color: #eaeaea;
                  cursor: pointer;
                }
                
                /* 悬浮时固定列背景色也随之变化 */
                .sticky-table tbody tr:hover td.sticky-left {
                  background-color: #f8f8f8;
                }
                
                /* 选中行悬浮时固定列的背景色 */
                .sticky-table tbody tr.selected:hover td.sticky-left {
                  background-color: #eaeaea; /* 与选中行悬浮背景色一致 */
                }
                
                /* 只读单元格样式 */
                .sticky-table .readonly-text {
                  text-align: center;
                  padding: 8px 12px;
                  line-height: 1.25;
                  min-height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                }
                
                /* 描述文本样式 */
                .sticky-table .description-text {
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                
                /* 输入框样式统一 */
                .sticky-table input,
                .sticky-table button,
                .sticky-table textarea {
                  font-size: 14px !important;
                }
                
                /* 字体样式统一 */
                .sticky-table tbody tr.selected td,
                .sticky-table tbody tr:not(.selected) td {
                  font-size: 14px;
                  font-weight: normal;
                }
              `}</style>
              
              {/* 使用原生表格 */}
              <table className="sticky-table">
                <thead>
                  <tr>
                    {columns.map((column, colIndex) => (
                      <th 
                        key={column.key}
                        className={colIndex === 0 ? 'sticky-left' : ''}
                        style={{ 
                          width: column.width,
                          minWidth: column.minWidth,
                        }}
                      >
                        {column.dataIndex === 'select' ? (
                          <div className="flex justify-center items-center w-full h-full">
                            <Checkbox 
                              checked={selectAll} 
                              onCheckedChange={handleSelectAll}
                            />
                          </div>
                        ) : (
                          column.title
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      row={row}
                      columns={columns}
                      isSelected={selectedRows.has(row.id)}
                      onRowSelect={handleRowSelect}
                      onInputChange={handleInputChange}
                      onDateChange={handleDateChange}
                      onKeyDown={handleKeyDown}
                      getCellContent={getCellContent}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>

      {/* <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex flex-col items-start gap-2">
      </CardFooter> */}
    </Card>
  )
}

export default DemandRecordTable
