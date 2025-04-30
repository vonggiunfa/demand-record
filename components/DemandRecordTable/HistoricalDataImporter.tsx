import { DemandRecord } from "@/types/demand";
import { format, parse } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_PATH, ToastProps } from "./types";

// 按年月分组的数据
interface GroupedRecords {
  [yearMonth: string]: DemandRecord[];
}

/**
 * 从CSV导入历史数据
 * @param toast - Toast通知函数
 */
export const importHistoricalDataFromCSV = async (toast: (props: ToastProps) => void) => {
  toast({
    title: "选择CSV文件",
    description: "请选择包含历史数据的CSV文件",
    variant: "default"
  });

  try {
    // 创建文件输入元素
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    
    // 监听文件选择
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      await processCSVFile(file, toast);
    };
    
    // 触发文件选择对话框
    fileInput.click();
  } catch (error) {
    console.error("创建文件选择器失败:", error);
    toast({
      title: "操作失败",
      description: "无法创建文件选择器",
      variant: "destructive"
    });
  }
};

/**
 * 处理CSV文件
 * @param file - CSV文件
 * @param toast - Toast通知函数
 */
const processCSVFile = async (file: File, toast: (props: ToastProps) => void) => {
  toast({
    title: "开始处理",
    description: "正在读取CSV文件...",
    variant: "default"
  });
  
  try {
    const content = await readFileContent(file);
    const records = parseCSVContent(content);
    
    if (!records.length) {
      toast({
        title: "导入失败",
        description: "CSV文件中没有有效的记录数据",
        variant: "warning"
      });
      return;
    }
    
    toast({
      title: "处理中",
      description: `读取到 ${records.length} 条记录，正在处理...`,
      variant: "default"
    });
    
    // 按年月分组
    const groupedRecords = groupRecordsByMonth(records);
    const months = Object.keys(groupedRecords).sort();
    
    if (!months.length) {
      toast({
        title: "导入失败",
        description: "无法解析记录的创建时间",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "准备导入",
      description: `已按照创建时间将记录分组为 ${months.length} 个月份`,
      variant: "default"
    });
    
    // 导入数据
    await importGroupedRecords(groupedRecords, toast);
    
  } catch (error) {
    console.error("处理CSV文件失败:", error);
    toast({
      title: "导入失败",
      description: error instanceof Error ? error.message : "处理CSV文件时出错",
      variant: "destructive"
    });
  }
};

/**
 * 读取文件内容
 * @param file - 文件对象
 * @returns 文件内容
 */
const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("读取文件内容失败"));
      }
    };
    reader.onerror = (e) => reject(new Error("读取文件时发生错误"));
    reader.readAsText(file);
  });
};

/**
 * 解析CSV内容
 * @param content - CSV文件内容
 * @returns 需求记录数组
 */
const parseCSVContent = (content: string): DemandRecord[] => {
  const lines = content.split(/\r?\n/);
  if (lines.length <= 1) {
    throw new Error("CSV文件格式无效或为空");
  }
  
  // 解析标题行
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // 查找必要的列索引
  const demandIdIndex = headers.findIndex(h => h === 'demandid');
  const descriptionIndex = headers.findIndex(h => h === 'description');
  const createdAtIndex = headers.findIndex(h => h === 'createdat');
  
  if (demandIdIndex === -1 || descriptionIndex === -1) {
    throw new Error("CSV文件缺少必要的列（demandId, description）");
  }
  
  const records: DemandRecord[] = [];
  
  // 从第2行开始解析数据
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 处理引号中可能包含逗号的情况
    const values = parseCSVLine(line);
    
    if (values.length <= Math.max(demandIdIndex, descriptionIndex, createdAtIndex !== -1 ? createdAtIndex : 0)) {
      console.warn(`第${i+1}行数据不完整，已跳过`);
      continue;
    }
    
    const demandId = values[demandIdIndex].trim();
    const description = values[descriptionIndex].trim();
    
    // 解析创建时间
    let createdAt = new Date();
    if (createdAtIndex !== -1 && values[createdAtIndex]) {
      try {
        // 尝试解析多种可能的日期格式
        const createdAtStr = values[createdAtIndex].trim();
        createdAt = parseDateWithFormats(createdAtStr);
      } catch (error) {
        console.warn(`无法解析第${i+1}行的创建时间，使用当前时间`);
      }
    }
    
    records.push({
      id: uuidv4(),
      demandId,
      description,
      createdAt
    });
  }
  
  return records;
};

/**
 * 尝试多种格式解析日期
 * @param dateStr - 日期字符串
 * @returns 解析后的日期对象
 */
const parseDateWithFormats = (dateStr: string): Date => {
  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd HH:mm',
    'yyyy-MM-dd',
    'yyyy/MM/dd'
  ];
  
  for (const fmt of formats) {
    try {
      return parse(dateStr, fmt, new Date());
    } catch {
      // 尝试下一种格式
    }
  }
  
  // 如果上述格式都失败，直接使用Date构造函数尝试
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  throw new Error(`无法解析日期: ${dateStr}`);
};

/**
 * 正确解析CSV行，处理引号内的逗号
 * @param line - CSV行
 * @returns 字段值数组
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : '';
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // 双引号转义
        currentValue += '"';
        i++;
      } else {
        // 切换引号状态
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // 非引号中的逗号为字段分隔符
      result.push(currentValue);
      currentValue = '';
    } else {
      // 普通字符
      currentValue += char;
    }
  }
  
  // 添加最后一个字段
  result.push(currentValue);
  
  return result;
};

/**
 * 按年月分组记录
 * @param records - 需求记录数组
 * @returns 按年月分组的记录
 */
const groupRecordsByMonth = (records: DemandRecord[]): GroupedRecords => {
  const grouped: GroupedRecords = {};
  
  for (const record of records) {
    // 提取年月
    const yearMonth = format(record.createdAt, 'yyyy-MM');
    
    if (!grouped[yearMonth]) {
      grouped[yearMonth] = [];
    }
    
    grouped[yearMonth].push(record);
  }
  
  return grouped;
};

/**
 * 检查记录是否已存在
 * @param yearMonth - 年月
 * @param records - 待检查的记录
 * @returns 返回已存在的记录ID
 */
const checkExistingRecords = async (yearMonth: string, records: DemandRecord[]): Promise<Set<string>> => {
  try {
    // 获取当前月份已有记录
    const response = await fetch(`${API_BASE_PATH}/api/load-data?yearMonth=${yearMonth}`);
    if (!response.ok) {
      throw new Error(`获取月份 ${yearMonth} 数据失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success || !data.data || !data.data.records) {
      return new Set();
    }
    
    // 构建已存在记录的demandId集合
    const existingDemandIds = new Set<string>();
    data.data.records.forEach((record: DemandRecord) => {
      if (record.demandId) {
        existingDemandIds.add(record.demandId);
      }
    });
    
    return existingDemandIds;
  } catch (error) {
    console.error(`检查月份 ${yearMonth} 已有记录失败:`, error);
    return new Set();
  }
};

/**
 * 导入分组后的记录
 * @param groupedRecords - 按年月分组的记录
 * @param toast - Toast通知函数
 */
const importGroupedRecords = async (groupedRecords: GroupedRecords, toast: (props: ToastProps) => void) => {
  const months = Object.keys(groupedRecords).sort();
  
  // 统计信息
  const stats = {
    totalMonths: months.length,
    successMonths: 0,
    failedMonths: 0,
    totalRecords: 0,
    addedRecords: 0, 
    skippedRecords: 0
  };
  
  for (const month of months) {
    const records = groupedRecords[month];
    stats.totalRecords += records.length;
    
    toast({
      title: "导入进度",
      description: `正在处理月份 ${month} (${months.indexOf(month) + 1}/${months.length})...`,
      variant: "default"
    });
    
    try {
      // 检查已存在的记录
      const existingRecords = await checkExistingRecords(month, records);
      
      // 过滤出不重复的记录
      const uniqueRecords = records.filter(record => !existingRecords.has(record.demandId));
      
      const skippedCount = records.length - uniqueRecords.length;
      stats.skippedRecords += skippedCount;
      
      if (uniqueRecords.length === 0) {
        toast({
          title: "月份已跳过",
          description: `${month} 的所有记录 (${skippedCount}条) 已存在，已跳过`,
          variant: "warning"
        });
        continue;
      }
      
      // 保存非重复记录
      const success = await saveMonthData(month, uniqueRecords);
      
      if (success) {
        stats.successMonths++;
        stats.addedRecords += uniqueRecords.length;
        
        toast({
          title: "月份导入成功",
          description: `${month}: 成功导入 ${uniqueRecords.length} 条记录，跳过 ${skippedCount} 条已存在记录`,
          variant: "success"
        });
      } else {
        stats.failedMonths++;
        
        toast({
          title: "月份导入失败",
          description: `${month}: 导入 ${uniqueRecords.length} 条记录失败`,
          variant: "destructive"
        });
      }
    } catch (error) {
      stats.failedMonths++;
      
      console.error(`导入月份 ${month} 失败:`, error);
      toast({
        title: "月份导入失败",
        description: `${month}: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive"
      });
    }
    
    // 休眠一段时间，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 显示最终结果
  if (stats.failedMonths === 0) {
    toast({
      title: "导入完成",
      description: `成功导入 ${stats.successMonths} 个月份，共 ${stats.addedRecords} 条记录，跳过 ${stats.skippedRecords} 条已存在记录`,
      variant: "success"
    });
  } else {
    toast({
      title: "部分导入成功",
      description: `成功: ${stats.successMonths} 个月份，失败: ${stats.failedMonths} 个月份，导入 ${stats.addedRecords} 条记录，跳过 ${stats.skippedRecords} 条已存在记录`,
      variant: "warning"
    });
  }
  
  // 如果有成功导入的月份，刷新页面
  if (stats.successMonths > 0) {
    toast({
      title: "刷新页面",
      description: "将在2秒后刷新页面以显示最新数据...",
      variant: "default"
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};

/**
 * 保存月份数据
 * @param yearMonth - 年月
 * @param records - 需求记录数组
 * @returns 是否保存成功
 */
const saveMonthData = async (yearMonth: string, records: DemandRecord[]): Promise<boolean> => {
  try {
    if (!records.length) return true;
    
    const payload = {
      yearMonth,
      data: {
        lastUpdated: new Date().toISOString(),
        records
      },
      onlySelected: true // 使用增量保存模式
    };
    
    const response = await fetch(`${API_BASE_PATH}/api/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API响应状态错误: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`保存月份 ${yearMonth} 数据失败:`, error);
    return false;
  }
}; 