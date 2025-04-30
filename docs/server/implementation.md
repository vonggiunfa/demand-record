# 服务端实现

## 概述

本文档详细描述了需求记录系统的服务端实现细节，包括代码组织、数据库访问和API实现。

## 技术栈

- **Web框架**: Next.js API Routes
- **数据库**: SQLite
- **数据库驱动**: better-sqlite3
- **错误处理**: 统一错误响应格式
- **数据验证**: 使用Zod进行请求验证

## 代码结构

```
lib/
├── db.ts                    # 数据库操作核心
└── demandService.ts         # 需求记录服务
app/api/
├── load-data/
│   └── route.ts             # 加载数据API
├── save-data/
│   └── route.ts             # 保存数据API
└── year-months/
    └── route.ts             # 年月列表API
```

## 核心模块

### 数据库模块 (lib/db.ts)

提供对SQLite数据库的基础操作和连接管理。

```typescript
// lib/db.ts (简化示例)
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据库文件路径
const DB_PATH = path.join(DATA_DIR, 'demands.db');

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用WAL模式提高并发性能
db.pragma('journal_mode = WAL');

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS demand_records (
    id TEXT PRIMARY KEY,
    demand_id TEXT,
    description TEXT,
    created_at TEXT NOT NULL,
    year_month TEXT NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_demand_records_year_month 
  ON demand_records(year_month);
`);

export default db;
```

### 需求服务模块 (lib/demandService.ts)

封装业务逻辑，提供需求记录的增删改查操作。

```typescript
// lib/demandService.ts (简化示例)
import db from './db';

export interface DemandRecord {
  id: string;
  demandId: string;
  description: string;
  createdAt: Date;
}

interface DbDemandRecord {
  id: string;
  demand_id: string;
  description: string;
  created_at: string;
  year_month: string;
}

// 获取指定年月的需求记录
export function getRecordsByYearMonth(yearMonth: string): DemandRecord[] {
  const query = db.prepare(`
    SELECT id, demand_id, description, created_at
    FROM demand_records
    WHERE year_month = ?
    ORDER BY created_at DESC
  `);
  
  const records = query.all(yearMonth) as DbDemandRecord[];
  
  // 转换为前端模型
  return records.map(record => ({
    id: record.id,
    demandId: record.demand_id,
    description: record.description,
    createdAt: new Date(record.created_at)
  }));
}

// 保存指定年月的需求记录（替换模式）
export function saveRecords(yearMonth: string, records: DemandRecord[]): number {
  // 开始事务
  const transaction = db.transaction(() => {
    // 删除原有记录
    const deleteStmt = db.prepare(`
      DELETE FROM demand_records WHERE year_month = ?
    `);
    deleteStmt.run(yearMonth);
    
    // 插入新记录
    const insertStmt = db.prepare(`
      INSERT INTO demand_records (id, demand_id, description, created_at, year_month)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const record of records) {
      insertStmt.run(
        record.id,
        record.demandId,
        record.description,
        record.createdAt.toISOString(),
        yearMonth
      );
    }
    
    return records.length;
  });
  
  // 执行事务
  return transaction();
}

// 获取所有可用年月
export function getAllYearMonths(): string[] {
  const query = db.prepare(`
    SELECT DISTINCT year_month
    FROM demand_records
    ORDER BY year_month DESC
  `);
  
  const results = query.all() as { year_month: string }[];
  return results.map(row => row.year_month);
}

// 获取所有需求记录（不限年月）
export function getAllDemands(): DemandRecord[] {
  const query = db.prepare(`
    SELECT id, demand_id, description, created_at
    FROM demand_records
    ORDER BY created_at DESC
  `);
  
  const records = query.all() as DbDemandRecord[];
  
  // 转换为前端模型
  return records.map(record => ({
    id: record.id,
    demandId: record.demand_id,
    description: record.description,
    createdAt: new Date(record.created_at)
  }));
}
```

## API 实现

### 加载数据 API (app/api/load-data/route.ts)

```typescript
// app/api/load-data/route.ts (简化示例)
import { NextRequest, NextResponse } from 'next/server';
import { getRecordsByYearMonth } from '@/lib/demandService';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const yearMonth = searchParams.get('yearMonth') || getCurrentYearMonth();
    
    // 从服务层获取数据
    const records = getRecordsByYearMonth(yearMonth);
    
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
    console.error('加载数据失败:', error);
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
```

### 保存数据 API (app/api/save-data/route.ts)

```typescript
// app/api/save-data/route.ts (简化示例)
import { NextRequest, NextResponse } from 'next/server';
import { saveRecords } from '@/lib/demandService';
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

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData = await request.json();
    
    // 验证请求数据
    const validationResult = SaveRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: "请求参数无效",
        error: validationResult.error.toString()
      }, { status: 400 });
    }
    
    const { yearMonth, data } = validationResult.data;
    
    // 保存数据
    const recordCount = saveRecords(yearMonth, data.records);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: `数据保存成功，共保存 ${recordCount} 条记录`,
      recordCount
    });
  } catch (error) {
    // 返回错误响应
    console.error('保存数据失败:', error);
    return NextResponse.json({
      success: false,
      message: "保存数据失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
```

### 获取年月列表 API (app/api/year-months/route.ts)

```typescript
// app/api/year-months/route.ts (简化示例)
import { NextResponse } from 'next/server';
import { getAllYearMonths } from '@/lib/demandService';

export async function GET() {
  try {
    // 获取所有年月
    const yearMonths = getAllYearMonths();
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "年月列表获取成功",
      yearMonths
    });
  } catch (error) {
    // 返回错误响应
    console.error('获取年月列表失败:', error);
    return NextResponse.json({
      success: false,
      message: "获取年月列表失败",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
```

### 获取所有数据 API (app/api/all-demands/route.ts)

```typescript
// app/api/all-demands/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllDemands } from '@/lib/demandService';

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
```

## 错误处理

所有API端点使用统一的错误处理模式：

1. 使用try-catch捕获所有可能的异常
2. 返回统一的错误响应格式
3. 在服务器端记录详细错误日志
4. 客户端只返回必要的错误信息

## 性能优化

1. **事务处理**：批量操作时使用事务确保性能和数据一致性
2. **索引优化**：关键查询字段添加索引
3. **数据校验**：使用Zod进行高效的数据验证
4. **精确查询**：只查询必要的字段，避免加载不必要的数据

## 安全考虑

1. **输入验证**：所有API输入都经过严格验证
2. **错误信息隐藏**：生产环境中隐藏详细技术错误信息
3. **异常处理**：妥善处理所有可能的异常情况
4. **事务回滚**：在操作失败时自动回滚数据更改 