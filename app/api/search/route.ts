import { searchByDemandId, searchByDescription } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 搜索请求验证模式
const SearchQuerySchema = z.object({
  term: z.string().min(1, '搜索词不能为空'),
  type: z.enum(['id', 'description'], {
    errorMap: () => ({ message: "搜索类型必须为'id'或'description'" })
  }),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
});

/**
 * 搜索需求记录API
 * GET /api/search?term=XXX&type=id|description&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const params = {
      term: searchParams.get('term') || '',
      type: searchParams.get('type') || 'id',
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0'
    };
    
    console.log(`[API] 搜索请求: term="${params.term}", type=${params.type}, limit=${params.limit}, offset=${params.offset}`);
    
    // 验证请求参数
    const validationResult = SearchQuerySchema.safeParse({
      term: params.term,
      type: params.type,
      limit: parseInt(params.limit, 10),
      offset: parseInt(params.offset, 10)
    });
    
    if (!validationResult.success) {
      console.error('[API] 搜索参数验证失败:', validationResult.error);
      return NextResponse.json({
        success: false,
        message: "搜索参数无效",
        error: validationResult.error.toString()
      }, { status: 400 });
    }
    
    // 提取验证后的参数
    const { term, type, limit, offset } = validationResult.data;
    
    // 根据搜索类型执行不同的搜索
    const searchResult = type === 'id'
      ? searchByDemandId(term, limit, offset)
      : searchByDescription(term, limit, offset);
    
    console.log(`[API] 搜索结果: 找到 ${searchResult.total} 条匹配记录，返回 ${searchResult.records.length} 条`);
    
    // 返回搜索结果
    return NextResponse.json({
      success: true,
      message: "搜索完成",
      data: searchResult
    });
  } catch (error) {
    // 返回错误响应
    console.error('[API] 搜索执行失败:', error);
    return NextResponse.json({
      success: false,
      message: "搜索失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 