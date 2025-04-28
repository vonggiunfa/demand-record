import { getAvailableMonths, getDemandsByMonth } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('开始处理获取月份列表请求', {
      url: req.url,
      method: req.method,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record'
    });
    
    // 获取所有可用月份
    const months = getAvailableMonths();
    console.log(`找到 ${months.length} 个可用月份`);
    
    // 添加每个月份的记录数量调试信息
    const monthsWithCount = months.map(month => {
      const records = getDemandsByMonth(month);
      return {
        month,
        count: records.length
      };
    });
    
    // 记录月份数据用于调试
    console.log('所有月份的数据统计:', JSON.stringify(monthsWithCount, null, 2));
    
    return NextResponse.json({
      success: true,
      message: '月份列表获取成功',
      months,
      debug: {
        monthsWithCount
      }
    });
  } catch (error) {
    console.error('获取月份列表错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '获取月份列表失败',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 