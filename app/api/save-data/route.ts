import fs from 'fs';
import { mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    console.log('开始处理保存数据请求', {
      url: req.url,
      method: req.method,
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record'
    });
    // 解析请求体
    const body = await req.text();
    let data, fileName;
    
    try {
      const parsedBody = JSON.parse(body);
      fileName = parsedBody.fileName;
      data = parsedBody.data;
      console.log(`解析请求体成功: 文件名=${fileName}, 数据记录数=${data?.records?.length || 0}`);
    } catch (parseError) {
      console.error('请求体解析错误:', parseError);
      return NextResponse.json(
        { success: false, message: '无效的JSON请求体', details: String(parseError) },
        { status: 400 }
      );
    }
    
    if (!fileName || !data) {
      console.error('文件名或数据不能为空', { fileName, hasData: !!data });
      return NextResponse.json(
        { success: false, message: '文件名或数据不能为空' },
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
    
    console.log('保存路径:', { dataDir, filePath, cwd: process.cwd() });
    
    try {
      // 确保目录存在 - 使用多种方法尝试创建目录
      try {
        // 首先尝试使用promises版本
        await mkdir(dataDir, { recursive: true });
        console.log('目录已创建(promises):', dataDir);
      } catch (mkdirError) {
        console.warn('使用promises创建目录失败，尝试同步方法:', mkdirError);
        // 如果失败，尝试同步方法
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
          console.log('目录已创建(sync):', dataDir);
        } else {
          console.log('目录已存在:', dataDir);
        }
      }
      
      // 验证目录是否确实存在
      if (!fs.existsSync(dataDir)) {
        throw new Error(`无法创建目录: ${dataDir}`);
      }
      
      // 验证目录可写
      try {
        fs.accessSync(dataDir, fs.constants.W_OK);
        console.log('目录可写:', dataDir);
      } catch (accessError) {
        throw new Error(`目录不可写: ${dataDir}, 错误: ${accessError}`);
      }
      
      // 准备写入的数据
      const jsonData = JSON.stringify(data, null, 2);
      console.log(`准备写入数据: ${jsonData.length} 字节`);
      
      // 写入文件 - 尝试多种方法
      try {
        // 首先尝试writeFileSync
        fs.writeFileSync(filePath, jsonData, 'utf-8');
        console.log('文件写入成功(sync)');
      } catch (writeError) {
        console.warn('同步写入失败，尝试异步写入:', writeError);
        // 如果失败，尝试写入临时文件，然后重命名
        const tempFilePath = `${filePath}.temp`;
        fs.writeFileSync(tempFilePath, jsonData, 'utf-8');
        fs.renameSync(tempFilePath, filePath);
        console.log('通过临时文件写入成功');
      }
      
      // 验证文件确实被创建
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件未被创建: ${filePath}`);
      }
      
      // 验证文件内容
      const writtenContent = fs.readFileSync(filePath, 'utf-8');
      if (writtenContent.length === 0) {
        throw new Error('文件内容为空');
      }
      
      console.log('数据保存成功');
      return NextResponse.json({
        success: true,
        message: '数据保存成功',
        path: filePath
      });
    } catch (fsError) {
      console.error('文件系统错误:', fsError);
      return NextResponse.json(
        { 
          success: false, 
          message: `文件系统操作失败: ${fsError instanceof Error ? fsError.message : '未知错误'}`,
          details: String(fsError),
          path: filePath
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API保存数据错误:', error);
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