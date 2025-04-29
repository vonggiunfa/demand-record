import { DemandRecord } from '@/types/demand';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_PATH, ToastProps } from './types';

// 历史数据结构
interface HistoricalData {
  name: string;        // 需求描述
  short_id: string;    // 需求ID
  created: string;     // 创建时间
}

// 月份数据结构
interface MonthlyData {
  [yearMonth: string]: DemandRecord[];
}

// 清洗并转换历史数据为系统格式
const cleanHistoricalData = (data: HistoricalData[]): DemandRecord[] => {
  return data.map(item => {
    // 解析日期
    const date = new Date(item.created);
    
    // 创建符合系统要求的记录
    return {
      id: uuidv4(),
      demandId: item.short_id,
      description: item.name,
      createdAt: date
    };
  });
};

// 按月份分组数据
const groupDataByMonth = (records: DemandRecord[]): MonthlyData => {
  const monthlyData: MonthlyData = {};
  
  records.forEach(record => {
    const date = record.createdAt;
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = [];
    }
    
    monthlyData[yearMonth].push(record);
  });
  
  return monthlyData;
};

// 导入指定月份数据
const importMonthData = async (yearMonth: string, records: DemandRecord[]): Promise<boolean> => {
  try {
    const payload = {
      yearMonth,
      data: {
        lastUpdated: new Date().toISOString(),
        records
      }
    };
    
    const response = await fetch(`${API_BASE_PATH}/api/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`导入 ${yearMonth} 数据失败:`, error);
    return false;
  }
};

// 历史数据
const historicalData: HistoricalData[] = [
  {
    "name": "POS结算页面增加品牌、货号筛选条件",
    "short_id": "1003616",
    "created": "2025-04-07 12:47"
  },
  {
    "name": "POS销售类别字典与店仓管理销售类型字典区分开来",
    "short_id": "1003556",
    "created": "2025-03-01 18:33"
  },
  {
    "name": "POS挂单修改客户",
    "short_id": "1003614",
    "created": "2025-04-07 11:53"
  },
  {
    "name": "POS支付流水查询清空查询条件查询系统变得非常卡",
    "short_id": "1003187",
    "created": "2025-03-03 11:58"
  },
  {
    "name": "分货列表-双击-新建分货单增加多次点击的控制",
    "short_id": "1003580",
    "created": "2025-03-01 15:44"
  },
  {
    "name": "分货单列表---新建状态的单进行拆分单单据",
    "short_id": "1003550",
    "created": "2025-03-20 13:43"
  },
  {
    "name": "合并分货单导出需求",
    "short_id": "1003570",
    "created": "2025-03-01 18:07"
  },
  {
    "name": "启用售罄率报表",
    "short_id": "1003628",
    "created": "2025-04-15 16:34"
  },
  {
    "name": "增加CC返单建议表",
    "short_id": "1003569",
    "created": "2025-03-01 17:30"
  },
  {
    "name": "客户余额流水明细表开发",
    "short_id": "1003517",
    "created": "2025-03-22 16:38"
  },
  {
    "name": "店铺销售明细报表增加销售类别查询条件",
    "short_id": "1003588",
    "created": "2025-03-13 15:10"
  },
  {
    "name": "新增库存调拨单、采购指令列表、库存调整单三个报表的导出功能",
    "short_id": "1003623",
    "created": "2025-04-10 17:07"
  },
  {
    "name": "物流运费付款申请单功能优化",
    "short_id": "1003607",
    "created": "2025-03-28 14:14"
  },
  {
    "name": "订单管理增加小票预览功能",
    "short_id": "1003601",
    "created": "2025-03-21 14:40"
  },
  {
    "name": "采购付款申请详情页，增加发票一键下载发票的功能",
    "short_id": "1003608",
    "created": "2025-03-28 14:22"
  },
  {
    "name": "采购单-原单含做作价比格式，增加利润点，做价比的取值逻辑调整",
    "short_id": "1003609",
    "created": "2025-03-28 14:23"
  },
  {
    "name": "采购单-采购打印增加格式",
    "short_id": "1003584",
    "created": "2025-03-07 15:01"
  },
  {
    "name": "销售/退货收入报表开发",
    "short_id": "1003516",
    "created": "2025-03-22 16:29"
  },
  {
    "name": "CC&TOP2系统集成界面",
    "short_id": "1003610",
    "created": "2025-03-29 14:54"
  },
  {
    "name": "店铺挂单明细报表调整",
    "short_id": "1003611",
    "created": "2025-04-01 10:41"
  },
  {
    "name": "POS库存调拨列表页调整",
    "short_id": "1003615",
    "created": "2025-04-07 12:36"
  },
  {
    "name": "POS录单、结算页面图片放大",
    "short_id": "1003613",
    "created": "2025-04-07 11:41"
  },
  {
    "name": "POS挂单自动取消",
    "short_id": "1003585",
    "created": "2025-03-10 11:31"
  },
  {
    "name": "POS挂单自动取消增补需求",
    "short_id": "1003603",
    "created": "2025-03-24 15:05"
  },
  {
    "name": "中台-库存管理-RFID全生命周期查询导出功能优化",
    "short_id": "1003621",
    "created": "2025-04-09 16:27"
  },
  {
    "name": "库存中心增加采购在途库存查询",
    "short_id": "1003586",
    "created": "2025-03-10 11:34"
  },
  {
    "name": "POS挂单自动取消增补需求",
    "short_id": "1003602",
    "created": "2025-03-24 14:35"
  },
  {
    "name": "店铺销售明细报表增加销售类别前端调整",
    "short_id": "1003577",
    "created": "2025-03-01 16:07"
  }
];

// 导入历史数据
export const importHistoricalData = async (toast: (props: ToastProps) => void) => {
  try {
    // 显示开始导入提示
    toast({
      title: "开始导入",
      description: "正在清洗和准备历史数据...",
      variant: "default"
    });
    
    // 清洗数据
    const cleanedData = cleanHistoricalData(historicalData);
    
    // 按月份分组
    const monthlyData = groupDataByMonth(cleanedData);
    
    // 获取所有月份并排序
    const allMonths = Object.keys(monthlyData).sort();
    
    // 记录成功和失败的月份
    const successful: string[] = [];
    const failed: string[] = [];
    
    // 按月份批量导入
    for (const month of allMonths) {
      toast({
        title: "导入进行中",
        description: `正在导入 ${month} 的数据...`,
        variant: "default"
      });
      
      const success = await importMonthData(month, monthlyData[month]);
      
      if (success) {
        successful.push(month);
      } else {
        failed.push(month);
      }
      
      // 等待一段时间再导入下一个月份，避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 导入完成，显示结果
    if (failed.length === 0) {
      toast({
        title: "导入完成",
        description: `成功导入 ${successful.length} 个月份的历史数据`,
        variant: "success"
      });
    } else {
      toast({
        title: "部分导入成功",
        description: `成功: ${successful.length} 个月份, 失败: ${failed.length} 个月份`,
        variant: "warning"
      });
    }
    
    // 刷新页面以显示最新数据
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('导入历史数据失败:', error);
    toast({
      title: "导入失败",
      description: "处理历史数据时出错",
      variant: "destructive"
    });
  }
}; 