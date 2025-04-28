import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 数据库文件路径
const DB_PATH = path.resolve(process.cwd(), 'data/demands.db');

// 确保数据库目录存在
const ensureDbDirectory = () => {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};

// 获取数据库连接
let dbInstance: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (!dbInstance) {
    ensureDbDirectory();
    dbInstance = new Database(DB_PATH, { 
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined 
    });
    
    // 设置数据库为WAL模式，提高并发性能
    dbInstance.pragma('journal_mode = WAL');
    
    // 启用外键约束
    dbInstance.pragma('foreign_keys = ON');
    
    // 初始化数据库结构
    initTables();
  }
  
  return dbInstance;
};

// 关闭数据库连接
export const closeDb = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

// 初始化表结构
const initTables = () => {
  const db = dbInstance as Database.Database;
  
  // 创建需求记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS demand_records (
      id TEXT PRIMARY KEY,
      demand_id TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      month TEXT NOT NULL
    );
    
    -- 添加月份索引以加速查询
    CREATE INDEX IF NOT EXISTS idx_demand_records_month ON demand_records(month);
  `);
};

// 执行查询并返回所有结果
export const query = <T>(sql: string, params: any = {}): T[] => {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(params) as T[];
};

// 执行查询并返回单个结果
export const queryOne = <T>(sql: string, params: any = {}): T | null => {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(params) as T | null;
};

// 执行插入/更新/删除等操作
export const execute = (sql: string, params: any = {}): number => {
  const db = getDb();
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  return result.changes;
};

// 开始事务
export const beginTransaction = () => {
  const db = getDb();
  db.exec('BEGIN TRANSACTION');
};

// 提交事务
export const commitTransaction = () => {
  const db = getDb();
  db.exec('COMMIT');
};

// 回滚事务
export const rollbackTransaction = () => {
  const db = getDb();
  db.exec('ROLLBACK');
};

// 执行事务
export const transaction = <T>(callback: () => T): T => {
  const db = getDb();
  return db.transaction(callback)();
};

// 获取月份格式化函数（用于确保月份格式一致）
export const formatMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// 确保数据库关闭
process.on('exit', closeDb);
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
}); 