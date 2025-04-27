"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { BarChart, Calendar as CalendarIcon, ChevronDown, ChevronUp, Download, HelpCircle, Plus, Trash2, Upload } from "lucide-react"
import React, { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import MoneyInput, { divide, formatMoney, isNegativeValue, subtract, sum } from "./MoneyInput"
import SalesCharts from "./SalesCharts"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"

// 定义数据类型
interface ReportData {
  id: string;
  date: Date;
  wechat: string;
  alipay: string;
  cash: string;
  meituan: string;
  douyin: string;
  takeout: string;
  total: string;
  people: string;
  average: string;
  vegetable: string;
  frozen: string;
  dry: string;
  purchaseTotal: string;
  factTotal: string;
}

// 定义列类型
interface ColumnType {
  title: string;
  dataIndex: string;
  key: string;
  isReadOnly: boolean;
  width: string;
  minWidth: string;
  isMoney: boolean;
  highlight?: boolean;
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
    isMoney: false,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    isReadOnly: true,
    width: '150px',
    minWidth: '150px',
    isMoney: false,
  },
  {
    title: '微信',
    dataIndex: 'wechat',
    key: 'wechat',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '支付宝',
    dataIndex: 'alipay',
    key: 'alipay',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '现金',
    dataIndex: 'cash',
    key: 'cash',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '美团',
    dataIndex: 'meituan',
    key: 'meituan',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '抖音',
    dataIndex: 'douyin',
    key: 'douyin',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '外卖',
    dataIndex: 'takeout',
    key: 'takeout',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '总营业额',
    dataIndex: 'total',
    key: 'total',
    isReadOnly: true,
    width: '150px',
    minWidth: '150px',
    highlight: true,
    isMoney: true,
  },
  {
    title: '人数',
    dataIndex: 'people',
    key: 'people',
    isReadOnly: false,
    width: '100px',
    minWidth: '100px',
    isMoney: false,
  },
  {
    title: '人均',
    dataIndex: 'average',
    key: 'average',
    isReadOnly: true,
    width: '150px',
    minWidth: '150px',
    isMoney: true,
  },
  {
    title: '蔬菜',
    dataIndex: 'vegetable',
    key: 'vegetable',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '冻品',
    dataIndex: 'frozen',
    key: 'frozen',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '干货',
    dataIndex: 'dry',
    key: 'dry',
    isReadOnly: false,
    width: '120px',
    minWidth: '100px',
    isMoney: true,
  },
  {
    title: '采购总额',
    dataIndex: 'purchaseTotal',
    key: 'purchaseTotal',
    isReadOnly: true,
    width: '150px',
    minWidth: '150px',
    isMoney: true,
  },
  {
    title: '实收营业额',
    dataIndex: 'factTotal',
    key: 'factTotal',
    isReadOnly: true,
    width: '150px',
    minWidth: '150px',
    highlight: true,
    isMoney: true,
  }
]

// 生成唯一ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
}

// 创建初始数据行
const createInitialRow = (): ReportData => ({
  id: generateId(),
  date: new Date(),
  wechat: '',
  alipay: '',
  cash: '',
  meituan: '',
  douyin: '',
  takeout: '',
  total: '',
  people: '',
  average: '',
  vegetable: '',
  frozen: '',
  dry: '',
  purchaseTotal: '',
  factTotal: '',
})

// 数字输入框处理
const formatNumberInput = (value: string) => {
  if (!value) return ''
  // 移除非数字字符（保留小数点）
  const numericValue = value.replace(/[^\d.]/g, '')
  // 确保只有一个小数点
  const parts = numericValue.split('.')
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`
  }
  return numericValue
}

// 创建行组件 - 使用React.memo优化渲染性能
const TableRow = React.memo(({
  row,
  columns,
  isSelected,
  onRowSelect,
  onInputChange,
  onDateChange,
  onBlur,
  onKeyDown,
  getCellContent,
}: {
  row: ReportData;
  columns: ColumnType[];
  isSelected: boolean;
  onRowSelect: (rowId: string, checked: boolean) => void;
  onInputChange: (rowId: string, key: string, value: string) => void;
  onDateChange: (rowId: string, date: Date | undefined) => void;
  onBlur: (rowId: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, rowId: string, columnIndex: number) => void;
  getCellContent: (row: ReportData, column: ColumnType, rowIndex: number, colIndex: number, isEditable: boolean) => React.ReactNode;
}) => {
  return (
    <tr className={isSelected ? 'selected' : ''}>
      {columns.map((column, colIndex) => (
        <td
          key={`${row.id}_${column.key}`}
          className={`
            ${column.dataIndex === 'select' ? 'w-10 p-0' : ''}
            ${colIndex === 0 ? 'sticky-left' : ''}
            ${colIndex === 1 ? 'sticky-left-2' : ''}
          `}
        >
          {getCellContent(row, column, 0, colIndex, isSelected)}
        </td>
      ))}
    </tr>
  );
});

/**
 * SalesReportTable - 销售报表表格组件
 * 
 * 性能优化点:
 * 1. 基于选择的输入和计算策略 - 只对选中行进行编辑和计算
 * 2. 组件化与记忆化 - 使用React.memo避免不必要的重新渲染
 * 3. 延迟输入处理 - 使用setTimeout减少状态更新频率
 * 4. 优化渲染 - 未选中行显示为只读，减少输入组件的渲染
 * 5. 计算优化 - 只对选中行进行计算，减少不必要的计算
 */
const SalesReportTable = () => {
  const [rows, setRows] = useState<ReportData[]>([])
  const [isClient, setIsClient] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [chartDataMode, setChartDataMode] = useState<'all' | 'selected'>('all')
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({})
  const [isChartsOpen, setIsChartsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  
  // 使用useCallback优化事件处理函数
  
  // 防抖函数 - 使用useRef保存函数引用，避免在重新渲染时创建新的防抖函数
  const debouncedInputChange = useRef((rowId: string, key: string, value: string) => {
    setRows(prevRows => {
      return prevRows.map(row => {
        if (row.id !== rowId) return row;
        
        // 对于非金额字段，使用简单的格式化
        if (key === 'people') {
          const formattedValue = formatNumberInput(value)
          return {
            ...row,
            [key]: formattedValue
          }
        }
        
        // 直接设置值（MoneyInput组件内部已经处理了格式化）
        return {
          ...row,
          [key]: value
        }
      });
    });
  }).current;
  
  // 设置延迟时间较短，保持响应性但减少更新频率
  const handleInputChangeDebounced = useCallback((rowId: string, key: string, value: string) => {
    // 只有选中的行才处理输入
    if (selectedRows.has(rowId)) {
      // 使用setTimeout代替lodash的debounce，更简单直接
      setTimeout(() => {
        debouncedInputChange(rowId, key, value);
      }, 50); // 设置较小的延迟，保持响应灵敏度
    }
  }, [selectedRows, debouncedInputChange]);

  // 处理输入变化
  const handleInputChange = useCallback((rowId: string, key: string, value: string) => {
    // 只处理选中行的输入
    if (selectedRows.has(rowId)) {
      handleInputChangeDebounced(rowId, key, value);
    }
  }, [selectedRows, handleInputChangeDebounced]);

  // 计算单行数据的派生值 - 使用useMemo优化计算
  const calculateRowValues = useCallback((row: ReportData): ReportData => {
    // 计算总营业额 = 微信 + 支付宝 + 现金 + 美团 + 抖音 + 外卖
    const incomeValues = [row.wechat, row.alipay, row.cash, row.meituan, row.douyin, row.takeout]
    const total = sum(incomeValues)
    
    // 计算采购总额 = 蔬菜 + 冻品 + 干货
    const purchaseValues = [row.vegetable, row.frozen, row.dry]
    const purchaseTotal = sum(purchaseValues)
    
    // 计算人均
    const average = row.people && total ? 
      divide(total, row.people) : ''
    
    // 计算实收营业额 = 总营业额 - 采购总额
    const factTotal = total && purchaseTotal ? 
      subtract(total, purchaseTotal) : ''
    
    return {
      ...row,
      total,
      purchaseTotal,
      average,
      factTotal
    }
  }, []);

  // 触发一行所有计算
  const calculateRow = useCallback((rowId: string) => {
    // 只计算选中行
    if (selectedRows.has(rowId)) {
      setRows(prevRows => {
        return prevRows.map(row => {
          if (row.id !== rowId) return row;
          return calculateRowValues(row);
        });
      });
    }
  }, [selectedRows, calculateRowValues]);

  // 当日期变化时更新日期
  const handleDateChange = useCallback((rowId: string, date: Date | undefined) => {
    // 只处理选中行
    if (selectedRows.has(rowId) && date) {
      setRows(prevRows => {
        return prevRows.map(row => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            date
          };
        });
      });
    }
  }, [selectedRows]);

  // 处理键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, rowId: string, currentIndex: number) => {
    // 只处理选中行
    if (!selectedRows.has(rowId)) return;
    
    if (e.key === 'Enter' || e.key === 'Tab') {
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
        // 当选择第一个行项目时，自动切换到选中数据模式
        if (newSelected.size === 1 && chartDataMode === 'all') {
          setChartDataMode('selected');
        }
      } else {
        newSelected.delete(rowId);
        // 当取消所有选择时，自动切换回全部数据模式
        if (newSelected.size === 0 && chartDataMode === 'selected') {
          setChartDataMode('all');
        }
      }
      return newSelected;
    });
  }, [chartDataMode]);

  // 处理全选
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // 全选
      const allIds = rows.map(row => row.id);
      setSelectedRows(new Set(allIds));
      // 自动切换到选中数据模式（如果有数据）
      if (rows.length > 0 && chartDataMode === 'all') {
        setChartDataMode('selected');
      }
    } else {
      // 取消全选
      setSelectedRows(new Set());
      // 自动切换回全部数据模式
      if (chartDataMode === 'selected') {
        setChartDataMode('all');
      }
    }
  }, [rows, chartDataMode]);

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
    
    // 移除"至少保留一行数据"的限制
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
            if (col.dataIndex === 'date') {
              return format(row.date, 'yyyy-MM-dd');
            }
            
            return row[col.dataIndex as keyof ReportData] || '';
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
      link.setAttribute('download', `销售数据_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
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
      // 分割为行
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        toast.error('CSV文件格式无效，至少需要表头和一行数据');
        return;
      }
      
      // 获取表头行
      const headers = lines[0].split(',');
      
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
      const newRows: ReportData[] = [];
      
      // 从第二行开始解析数据
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
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
          if (column.dataIndex === 'date') {
            try {
              // 支持多种日期格式
              let dateValue: Date | null = null;
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                // YYYY-MM-DD 格式
                dateValue = parse(value, 'yyyy-MM-dd', new Date());
              } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                // MM/DD/YYYY 格式
                dateValue = parse(value, 'MM/dd/yyyy', new Date());
              } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
                // YYYY/MM/DD 格式
                dateValue = parse(value, 'yyyy/MM/dd', new Date());
              }
              
              if (dateValue && !isNaN(dateValue.getTime())) {
                newRow.date = dateValue;
              } else {
                newRow.date = new Date(); // 默认为当前日期
              }
            } catch (dateError) {
              console.warn('日期解析错误', dateError);
              newRow.date = new Date(); // 默认为当前日期
            }
          } else {
            // 处理其他列的数据
            newRow[column.dataIndex as keyof ReportData] = value || '';
          }
        });
        
        // 添加到新行数组
        newRows.push(newRow);
      }
      
      if (newRows.length === 0) {
        toast.error('未找到有效数据行');
        return;
      }
      
      // 对每一行数据进行计算，确保派生字段有值
      const calculatedData = newRows.map(row => calculateRowValues(row));
      
      // 更新状态
      setRows(calculatedData);
      toast.success(`成功导入 ${calculatedData.length} 行数据`);
    } catch (error) {
      console.error('解析CSV数据时发生错误', error);
      toast.error('解析CSV文件失败');
    }
  }, [rows.length, columns, calculateRowValues]);

  // 获取单元格内容 - 根据选中状态决定是否可编辑
  const getCellContent = useCallback((row: ReportData, column: ColumnType, rowIndex: number, colIndex: number, isEditable: boolean) => {
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
    
    // 日期列 - 日期选择器或只读文本
    if (column.dataIndex === 'date') {
      if (isEditable) {
        // 可编辑状态 - 显示日期选择器
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {row.date ? format(row.date, 'yyyy-MM-dd') : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={row.date}
                onSelect={(date) => handleDateChange(row.id, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      } else {
        // 不可编辑状态 - 显示只读日期
        return (
          <div className="readonly-text">
            {row.date ? format(row.date, 'yyyy-MM-dd') : ''}
          </div>
        );
      }
    }
    
    // 只读列 - 显示值
    if (column.isReadOnly) {
      const value = row[column.dataIndex as keyof ReportData] as string;
      const isNegative = column.isMoney && isNegativeValue(value);
      const displayValue = column.isMoney && value ? formatMoney(value) : value;
      
      // 简化样式，移除边框和背景色
      return (
        <div className={`readonly-text 
          ${column.highlight ? 'highlight-text' : ''} 
          ${isNegative ? 'negative-text' : ''}`}>
          {displayValue || ''}
        </div>
      );
    }
    
    // 可编辑列 - 根据选中状态决定是否可编辑
    if (!isEditable) {
      // 不可编辑状态 - 显示只读文本，简化样式
      const value = row[column.dataIndex as keyof ReportData] as string;
      const displayValue = column.isMoney && value ? formatMoney(value) : value;
      
      return (
        <div className="readonly-text">
          {displayValue || ''}
        </div>
      );
    }
    
    // 可编辑金额列 - MoneyInput
    if (column.isMoney) {
      const value = row[column.dataIndex as keyof ReportData] as string;
      const isNegative = isNegativeValue(value);
      
      return (
        <MoneyInput
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[`${row.id}_${column.dataIndex}`] = el;
          }}
          value={value || ''}
          onChange={(value: string) => handleInputChange(row.id, column.dataIndex, value)}
          onBlur={() => calculateRow(row.id)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, row.id, colIndex)}
          placeholder="请输入"
          isNegative={isNegative}
        />
      );
    }
    
    // 其他可编辑列 - 普通Input
    return (
      <Input
        ref={(el) => {
          inputRefs.current[`${row.id}_${column.dataIndex}`] = el;
        }}
        value={row[column.dataIndex as keyof ReportData] as string || ''}
        onChange={(e) => handleInputChange(row.id, column.dataIndex, e.target.value)}
        onBlur={() => calculateRow(row.id)}
        onKeyDown={(e) => handleKeyDown(e, row.id, colIndex)}
        placeholder="请输入"
        className="text-center"
      />
    );
  }, [selectedRows, handleDateChange, handleInputChange, calculateRow, handleKeyDown, handleRowSelect]);

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

  // 当组件挂载时初始化
  useEffect(() => {
    setIsClient(true)
    // 不再初始化默认行
    // 不默认选中任何行
  }, [])

  // 当数据变化时自动计算每一行 - 优化为只计算选中行
  useEffect(() => {
    if (isClient) {
      setRows(prevRows => {
        return prevRows.map(row => {
          // 只计算选中行的数据
          if (selectedRows.has(row.id)) {
            return calculateRowValues(row)
          }
          return row
        })
      })
    }
  }, [isClient, selectedRows, calculateRowValues])

  // 当行数据变化时，更新全选状态
  useEffect(() => {
    if (rows.length > 0 && selectedRows.size === rows.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedRows, rows])

  // 获取图表展示的数据
  const getChartData = useCallback(() => {
    if (chartDataMode === 'selected' && selectedRows.size > 0) {
      return rows.filter(row => selectedRows.has(row.id));
    }
    return rows;
  }, [rows, selectedRows, chartDataMode]);

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
            <span className="text-sm text-muted-foreground ml-2">
              {hasSelected ? `已选择 ${selectedCount}/${totalCount} 行` : ''}
            </span>
          </div>
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
            <div className="text-sm text-gray-400">请点击上方"新增"按钮添加数据</div>
          </div>
        ) : (
          <div className="w-full relative" style={{ minWidth: "100%" }}>
            <div 
              className="overflow-auto border rounded-md custom-scrollbar table-container"
              style={{
                maxHeight: '50vh',
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
                
                .sticky-table th.sticky-left-2,
                .sticky-table td.sticky-left-2 {
                  position: sticky;
                  left: 40px; /* 第一列的宽度 */
                  z-index: 4;
                  background-color: #ffffff;
                }
                
                /* 固定列与固定表头的交叉部分 */
                .sticky-table thead th.sticky-left {
                  z-index: 15;
                }
                
                .sticky-table thead th.sticky-left-2 {
                  z-index: 14;
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
                .sticky-table tbody tr.selected td.sticky-left,
                .sticky-table tbody tr.selected td.sticky-left-2 {
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
                .sticky-table tbody tr:hover td.sticky-left,
                .sticky-table tbody tr:hover td.sticky-left-2 {
                  background-color: #f8f8f8;
                }
                
                /* 选中行悬浮时固定列的背景色 */
                .sticky-table tbody tr.selected:hover td.sticky-left,
                .sticky-table tbody tr.selected:hover td.sticky-left-2 {
                  background-color: #eaeaea; /* 与选中行悬浮背景色一致 */
                }
                
                /* 只读单元格样式 */
                .sticky-table .readonly-text {
                  text-align: center;
                  padding: 8px 6px;
                  line-height: 1.25;
                  min-height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                }
                
                /* 高亮列样式 */
                .sticky-table .highlight-text {
                  font-weight: 500;
                  color: #4b5563;
                }
                
                /* 负值样式 */
                .sticky-table .negative-text {
                  color: #dc2626;
                  font-weight: 500;
                }
                
                /* 输入框样式统一 */
                .sticky-table input,
                .sticky-table button {
                  font-size: 14px !important;
                }
                
                /* 字体样式统一 */
                .sticky-table tbody tr.selected td,
                .sticky-table tbody tr:not(.selected) td {
                  font-size: 14px;
                  font-weight: normal;
                }
                
                /* 高亮列一致性 */
                .sticky-table tbody tr.selected .highlight-text,
                .sticky-table tbody tr:not(.selected) .highlight-text {
                  font-weight: 500;
                }
              `}</style>
              
              {/* 使用原生表格替代shadcn的Table组件 */}
              <table className="sticky-table">
                <thead>
                  <tr>
                    {columns.map((column, colIndex) => (
                      <th 
                        key={column.key}
                        className={
                          colIndex === 0 ? 'sticky-left' : 
                          colIndex === 1 ? 'sticky-left-2' : ''
                        }
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
                      onBlur={calculateRow}
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

      {hasData && (
        <div className="px-4 pt-2 pb-4">
          <Collapsible
            open={isChartsOpen}
            onOpenChange={setIsChartsOpen}
            className="w-full border rounded-md"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between w-full p-4">
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  <span className="font-medium">
                    数据分析图表 
                    {chartDataMode === 'selected' && hasSelected ? 
                      selectedCount === totalCount ? 
                        '(已全选)' : 
                        `(已选择 ${selectedCount}/${totalCount})` 
                      : '(全部数据)'}
                  </span>
                </div>
                {isChartsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {chartDataMode === 'selected' && selectedRows.size === 0 ? 
                    "提示：未选择数据，显示全部数据" : 
                    chartDataMode === 'selected' ? 
                      `正在展示已选择的 ${selectedCount} 条数据` : 
                      `正在展示全部 ${totalCount} 条数据`}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={chartDataMode === 'all' ? 'default' : 'outline'}
                    onClick={() => setChartDataMode('all')}
                    className={chartDataMode === 'all' ? 'bg-black text-white' : ''}
                  >
                    全部数据
                  </Button>
                  <Button 
                    size="sm" 
                    variant={chartDataMode === 'selected' ? 'default' : 'outline'}
                    onClick={() => setChartDataMode('selected')}
                    className={chartDataMode === 'selected' ? 'bg-blue-600 text-white' : ''}
                    disabled={!hasSelected}
                  >
                    选中数据
                  </Button>
                </div>
              </div>
              <SalesCharts 
                rows={getChartData()} 
                key={`chart-${chartDataMode}-${selectedRows.size}-${chartDataMode === 'selected' && selectedRows.size > 0 ? Array.from(selectedRows).join('-') : 'all'}`}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      
      <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex flex-col items-start gap-2">
        <Collapsible
          open={isHelpOpen}
          onOpenChange={setIsHelpOpen}
          className="w-full border rounded-md mt-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center justify-between w-full p-2 h-auto">
              <div className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span className="font-medium text-sm">使用说明</span>
              </div>
              {isHelpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 text-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 text-base">销售数据表格使用指南</h3>
                <p className="mb-2">这是一个专为记录和分析销售数据设计的工具。以下是详细的操作指南：</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">基本操作</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>点击<strong>「新增」</strong>按钮添加新的数据行</li>
                  <li>勾选行前的复选框可<strong>选中行</strong>进行批量操作</li>
                  <li>表头的复选框可以<strong>全选/取消全选</strong>所有行</li>
                  <li>选中行后，点击<strong>「删除」</strong>按钮可删除选中的行</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">数据输入</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>必须先选中行</strong>才能编辑数据</li>
                  <li>点击<strong>日期</strong>单元格可选择日期</li>
                  <li>输入<strong>微信、支付宝、现金、美团、抖音、外卖</strong>等收入金额</li>
                  <li>输入<strong>人数</strong>，系统会自动计算人均消费</li>
                  <li>输入<strong>蔬菜、冻品、干货</strong>等采购成本</li>
                  <li><strong>总营业额、实收营业额、人均</strong>等字段会自动计算</li>
                  <li>使用Tab键或Enter键可在各输入框之间快速切换</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">数据导入导出</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>点击<strong>「导入CSV」</strong>按钮从本地导入之前保存的数据</li>
                  <li>点击<strong>「导出全部」</strong>按钮将所有数据导出为CSV文件保存到本地</li>
                  <li>选中部分行后，导出按钮变为<strong>「导出所选」</strong>，只导出选中的行</li>
                  <li>每次操作后建议及时<strong>导出数据</strong>到本地保存，防止数据丢失</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">数据分析</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>点击<strong>「数据分析图表」</strong>展开统计图表</li>
                  <li>图表可以显示<strong>全部数据</strong>或仅显示<strong>选中数据</strong></li>
                  <li>选中特定行后，图表会自动切换到<strong>「选中数据」</strong>模式</li>
                  <li>取消所有选择后，图表会自动切换回<strong>「全部数据」</strong>模式</li>
                  <li>图表包含<strong>营业额趋势、支付方式占比、采购成本占比、日收入分析</strong>等多种分析视图</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">常见问题</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>无法编辑数据？</strong> - 确保先选中(勾选)要编辑的行</li>
                  <li><strong>导入CSV失败？</strong> - 确保CSV格式正确，最好使用本系统导出的CSV文件</li>
                  <li><strong>数据计算错误？</strong> - 检查输入的金额格式是否正确</li>
                  <li><strong>图表未显示？</strong> - 可能是没有足够的有效数据，请先录入完整数据</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  )
}

export default SalesReportTable