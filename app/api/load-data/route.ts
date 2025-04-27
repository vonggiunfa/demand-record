import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    console.log('开始处理加载数据请求', {
      url: req.url,
      method: req.method,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record'
    });
    // 获取文件名参数
    const fileName = req.nextUrl.searchParams.get('fileName');
    console.log(`请求的文件名: ${fileName}`);
    
    if (!fileName) {
      console.error('文件名参数缺失');
      return NextResponse.json(
        { success: false, message: '文件名不能为空' },
        { status: 400 }
      );
    }
    
    // 确保文件名格式正确 (yyyy-mm.json)
    if (!/^\d{4}-\d{2}\.json$/.test(fileName)) {
      console.error('文件名格式错误', { fileName });
      return NextResponse.json(
        { success: false, message: '文件名格式不正确，应为 yyyy-mm.json' },
        { status: 400 }
      );
    }
    
    // 构建文件路径
    const dataDir = path.resolve(process.cwd(), 'data-json');
    const filePath = path.resolve(dataDir, fileName);
    
    console.log('加载路径:', { dataDir, filePath, cwd: process.cwd() });
    
    // 检查目录是否存在
    if (!fs.existsSync(dataDir)) {
      console.log('数据目录不存在:', dataDir);
      return NextResponse.json(
        { success: false, message: '数据目录不存在' },
        { status: 404 }
      );
    }
    
    // 检查文件是否存在 - 使用同步方法
    if (!fs.existsSync(filePath)) {
      console.log('文件不存在:', filePath);
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 验证文件可读
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log('文件可读:', filePath);
    } catch (accessError) {
      console.error('文件访问错误:', accessError);
      return NextResponse.json(
        { 
          success: false, 
          message: `文件不可读: ${accessError instanceof Error ? accessError.message : String(accessError)}`,
          details: String(accessError)
        },
        { status: 500 }
      );
    }
    
    try {
      // 读取文件内容 - 使用同步方法
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      console.log(`文件读取成功: ${fileContent.length} 字节`);
      
      if (fileContent.trim().length === 0) {
        console.error('文件内容为空');
        return NextResponse.json(
          { success: false, message: '文件内容为空' },
          { status: 500 }
        );
      }
      
      // 解析JSON
      let data;
      try {
        data = JSON.parse(fileContent);
        console.log(`解析JSON成功, 记录数: ${data?.records?.length || 0}`);
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError);
        return NextResponse.json(
          { 
            success: false, 
            message: `JSON解析失败: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
            details: String(jsonError)
          },
          { status: 500 }
        );
      }
      
      // 检查数据结构
      if (!data || !data.records || !Array.isArray(data.records)) {
        console.error('数据结构无效', data);
        return NextResponse.json(
          { success: false, message: '数据结构无效: 缺少records数组' },
          { status: 500 }
        );
      }
      
      console.log('数据加载成功');
      return NextResponse.json({
        success: true,
        message: '数据加载成功',
        data
      });
    } catch (fsError) {
      console.error('文件读取或解析错误:', fsError);
      return NextResponse.json(
        { 
          success: false, 
          message: `文件读取或解析失败: ${fsError instanceof Error ? fsError.message : '未知错误'}`,
          details: String(fsError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API加载数据错误:', error);
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