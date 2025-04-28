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

// 数据库单例
let db: Database.Database;

// 获取数据库连接
export const getDb = (): Database.Database => {
  if (!db) {
    console.log('[数据库] 初始化数据库连接...');
    db = new Database(DB_PATH);
    
    // 启用WAL模式提高并发性能
    db.pragma('journal_mode = WAL');
    
    // 初始化表结构
    db.exec(`
      CREATE TABLE IF NOT EXISTS demand_records (
        id TEXT PRIMARY KEY,
        demand_id TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        month TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_demand_records_month 
      ON demand_records(month);
    `);
    
    console.log('[数据库] 数据库连接初始化完成');
  }
  
  return db;
};

// 执行查询并返回所有结果
export const query = <T>(sql: string, params: any[] = []): T[] => {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  } catch (error) {
    console.error('[数据库] 查询执行失败:', error);
    return [];
  }
};

// 执行查询并返回单个结果
export const queryOne = <T>(sql: string, params: any[] = []): T | null => {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T || null;
  } catch (error) {
    console.error('[数据库] 查询执行失败:', error);
    return null;
  }
};

// 执行更新操作并返回影响的行数
export const execute = (sql: string, params: any[] = []): number => {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result.changes;
  } catch (error) {
    console.error('[数据库] 执行更新失败:', error);
    return 0;
  }
};

// 执行事务
export const transaction = <T>(fn: () => T): T => {
  const db = getDb();
  
  // 包装用户事务函数
  const wrappedFn = db.transaction(fn);
  
  try {
    return wrappedFn();
  } catch (error) {
    console.error('[数据库] 事务执行失败:', error);
    throw error;
  }
}; 