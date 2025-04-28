import { saveDemands } from '@/lib/demandService';
import { DemandRecord } from '@/types/demand';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求验证模式
const SaveRequestSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  data: z.object({
    lastUpdated: z.string(),
    records: z.array(z.object({
      id: z.string(),
      demandId: z.string().optional(),
      description: z.string().optional(),
      createdAt: z.string().transform(val => new Date(val))
    }))
  })
});

/**
 * 保存需求记录API
 * POST /api/save-data
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData = await request.json();
    
    console.log(`[API] 收到保存数据请求，年月: ${requestData?.yearMonth}, 记录数: ${requestData?.data?.records?.length || 0}`);
    
    // 检查请求数据基本结构
    if (!requestData || !requestData.yearMonth || !requestData.data || !requestData.data.records) {
      console.error('[API] 请求数据缺少必要字段');
      return NextResponse.json({
        success: false,
        message: "请求数据缺少必要字段",
        error: "缺少yearMonth或records字段"
      }, { status: 400 });
    }
    
    // 验证请求数据
    const validationResult = SaveRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      console.error('[API] 请求参数验证失败:', validationResult.error);
      return NextResponse.json({
        success: false,
        message: "请求参数无效",
        error: validationResult.error.toString()
      }, { status: 400 });
    }
    
    const { yearMonth, data } = validationResult.data;
    const records = data.records as DemandRecord[];
    
    // 空记录检查
    if (records.length === 0) {
      console.warn('[API] 尝试保存空记录列表');
      return NextResponse.json({
        success: true,
        message: "没有记录需要保存",
        recordCount: 0
      });
    }
    
    console.log(`[API] 验证通过，准备保存 ${records.length} 条记录到月份 ${yearMonth}`);
    
    // 保存数据
    const success = saveDemands(records, yearMonth);
    
    if (success) {
      console.log(`[API] 成功保存 ${records.length} 条记录`);
      return NextResponse.json({
        success: true,
        message: `数据保存成功，共保存 ${records.length} 条记录`,
        recordCount: records.length
      });
    } else {
      console.error('[API] 保存数据失败');
      return NextResponse.json({
        success: false,
        message: "保存数据失败",
        error: "数据库操作失败"
      }, { status: 500 });
    }
  } catch (error) {
    // 处理其他异常情况
    console.error('[API] 保存数据时发生异常:', error);
    return NextResponse.json({
      success: false,
      message: "保存数据时发生异常",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 