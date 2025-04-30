import { getAllDemands } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取所有需求记录API
 * GET /api/all-demands
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[API] 请求获取所有需求记录数据`);
    
    // 从服务层获取所有数据
    const records = getAllDemands();
    
    console.log(`[API] 成功加载所有需求记录，共 ${records.length} 条`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "所有数据加载成功",
      data: {
        lastUpdated: new Date().toISOString(),
        records
      }
    });
  } catch (error) {
    // 返回错误响应
    console.error('[API] 加载所有数据失败:', error);
    return NextResponse.json({
      success: false,
      message: "加载所有数据失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 