import { formatMonth } from '@/lib/db';
import { getDemandsByMonth } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = req.url;
    const searchParams = req.nextUrl.searchParams;
    
    console.log('开始处理加载数据请求', {
      url,
      method: req.method,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record',
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    // 获取文件名或月份参数
    const fileName = searchParams.get('fileName');
    const monthParam = searchParams.get('month');
    
    let month;
    let originSource = '';
    
    // 从文件名解析月份，优先使用fileName参数
    if (fileName && fileName.endsWith('.json')) {
      month = fileName.replace('.json', '');
      originSource = 'fileName';
      console.log(`[调试] 从文件名 "${fileName}" 解析出月份: "${month}"`);
    } else if (monthParam) {
      // 使用month参数
      month = monthParam;
      originSource = 'monthParam';
      console.log(`[调试] 从month参数获取月份: "${month}"`);
    } else {
      // 使用当前月份
      month = formatMonth(new Date());
      originSource = 'currentDate';
      console.log(`[调试] 使用当前日期生成月份: "${month}"`);
    }
    
    console.log(`[调试] 最终使用的月份参数: "${month}" (来源: ${originSource})`);
    
    // 验证月份格式
    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.error('[错误] 月份格式错误', { month, originSource });
      return NextResponse.json(
        { success: false, message: '月份格式不正确，应为 yyyy-mm' },
        { status: 400 }
      );
    }
    
    try {
      // 从数据库获取数据
      console.log(`[调试] 准备从数据库获取月份 "${month}" 的记录`);
      const records = getDemandsByMonth(month);
      console.log(`[调试] 成功从数据库读取 ${records.length} 条记录, 月份="${month}"`);
      
      if (records.length > 0) {
        console.log(`[调试] 月份 "${month}" 的第一条记录:`, JSON.stringify(records[0], null, 2));
      }
      
      return NextResponse.json({
        success: true,
        message: '数据加载成功',
        data: {
          lastUpdated: new Date().toISOString(),
          records,
          debug: {
            month,
            originSource,
            recordCount: records.length
          }
        }
      });
    } catch (dbError) {
      console.error('[错误] 数据库查询错误:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: `数据库查询失败: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
          details: String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[错误] API加载数据错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '加载失败',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 