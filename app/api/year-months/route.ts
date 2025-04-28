import { getAvailableMonths } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取可用年月列表API
 * GET /api/year-months
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] 请求获取可用年月列表');
    
    // 获取所有可用年月
    const yearMonths = getAvailableMonths();
    
    console.log(`[API] 成功获取 ${yearMonths.length} 个可用年月`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "年月列表获取成功",
      yearMonths
    });
  } catch (error) {
    // 返回错误响应
    console.error('[API] 获取年月列表失败:', error);
    return NextResponse.json({
      success: false,
      message: "获取年月列表失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 