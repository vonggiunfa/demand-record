import { getDemandsByMonth } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取需求记录API
 * GET /api/load-data?yearMonth=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    console.log(`[API] 请求加载月份 ${yearMonth} 的数据`);
    
    // 从服务层获取数据
    const records = getDemandsByMonth(yearMonth);
    
    console.log(`[API] 成功加载 ${records.length} 条需求记录`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "数据加载成功",
      data: {
        lastUpdated: new Date().toISOString(),
        records
      }
    });
  } catch (error) {
    // 返回错误响应
    console.error('[API] 加载数据失败:', error);
    return NextResponse.json({
      success: false,
      message: "加载数据失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 辅助函数：获取当前年月
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
} 