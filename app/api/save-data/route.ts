import { formatMonth } from '@/lib/db';
import { saveDemands } from '@/lib/demandService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[调试] 开始处理保存数据请求', {
      url: req.url,
      method: req.method,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record'
    });
    
    // 解析请求体
    const body = await req.text();
    let data, month, monthSource;
    
    try {
      const parsedBody = JSON.parse(body);
      data = parsedBody.data;
      
      // 处理两种可能的参数格式：fileName或直接提供month
      if (parsedBody.fileName && parsedBody.fileName.endsWith('.json')) {
        month = parsedBody.fileName.replace('.json', '');
        monthSource = 'fileName';
        console.log(`[调试] 从文件名提取月份: "${parsedBody.fileName}" -> "${month}"`);
      } else if (parsedBody.month) {
        month = parsedBody.month;
        monthSource = 'month';
        console.log(`[调试] 使用直接提供的月份: "${month}"`);
      } else {
        // 默认使用当前月份
        month = formatMonth(new Date());
        monthSource = 'currentDate';
        console.log(`[调试] 使用当前日期生成的月份: "${month}"`);
      }
      
      console.log(`[调试] 解析请求体成功: 月份=${month} (来源=${monthSource}), 数据记录数=${data?.records?.length || 0}`);
    } catch (parseError) {
      console.error('[错误] 请求体解析错误:', parseError);
      return NextResponse.json(
        { success: false, message: '无效的JSON请求体', details: String(parseError) },
        { status: 400 }
      );
    }
    
    if (!data || !data.records || !Array.isArray(data.records)) {
      console.error('[错误] 数据格式不正确', { hasData: !!data, hasRecords: !!data?.records });
      return NextResponse.json(
        { success: false, message: '数据格式不正确，缺少records数组' },
        { status: 400 }
      );
    }
    
    // 验证月份格式
    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.error('[错误] 月份格式错误', { month, monthSource });
      return NextResponse.json(
        { success: false, message: '月份格式不正确，应为 yyyy-mm' },
        { status: 400 }
      );
    }
    
    try {
      // 修复记录中的日期格式（将字符串转为Date对象）
      const records = data.records.map((record: any) => ({
        ...record,
        createdAt: new Date(record.createdAt)
      }));
      
      console.log(`[调试] 准备保存 ${records.length} 条记录到月份 "${month}"`);
      
      // 保存前检查数据示例
      if (records.length > 0) {
        console.log('[调试] 数据示例:', JSON.stringify(records[0], null, 2));
      }
      
      // 保存数据到SQLite
      const saveResult = saveDemands(records, month);
      
      if (!saveResult) {
        throw new Error('数据库保存失败');
      }
      
      console.log(`[调试] 成功保存 ${records.length} 条记录到数据库, 月份="${month}"`);
      
      return NextResponse.json({
        success: true,
        message: `数据保存成功，共保存 ${records.length} 条记录`,
        recordCount: records.length,
        debug: {
          month,
          monthSource
        }
      });
    } catch (dbError) {
      console.error('[错误] 数据库操作错误:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: `数据库操作失败: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
          details: String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[错误] API保存数据错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '保存失败',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 