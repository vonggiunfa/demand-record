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
const DB_WAL_PATH = path.join(DATA_DIR, 'demands.db-wal');
const DB_SHM_PATH = path.join(DATA_DIR, 'demands.db-shm');

// 备份数据库文件
const backupDatabase = () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const backupDir = path.join(DATA_DIR, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // 备份主数据库文件
  if (fs.existsSync(DB_PATH)) {
    try {
      const backupPath = path.join(backupDir, `demands_${timestamp}.db`);
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`[数据库] 已备份数据库到 ${backupPath}`);
    } catch (error) {
      console.error('[数据库] 备份数据库文件失败:', error);
    }
  }
  
  // 备份WAL和SHM文件（如果存在）
  [
    { src: DB_WAL_PATH, dest: path.join(backupDir, `demands_${timestamp}.db-wal`) },
    { src: DB_SHM_PATH, dest: path.join(backupDir, `demands_${timestamp}.db-shm`) }
  ].forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`[数据库] 已备份 ${src} 到 ${dest}`);
      } catch (error) {
        console.error(`[数据库] 备份 ${src} 失败:`, error);
      }
    }
  });
};

// 检测并处理数据库损坏
const handleCorruptedDatabase = () => {
  // 备份现有数据库
  backupDatabase();
  
  // 关闭现有连接
  if (db) {
    try {
      db.close();
      console.log('[数据库] 已关闭现有数据库连接');
    } catch (error) {
      console.error('[数据库] 关闭数据库连接失败:', error);
    }
    db = null as unknown as Database.Database;  // 使用null并类型转换
  }
  
  // 删除数据库文件
  [DB_PATH, DB_WAL_PATH, DB_SHM_PATH].forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`[数据库] 已删除可能损坏的文件: ${file}`);
      } catch (error) {
        console.error(`[数据库] 删除文件 ${file} 失败:`, error);
      }
    }
  });
  
  // 重新初始化数据库
  console.log('[数据库] 重新初始化数据库...');
  return getDb();
};

// 数据库单例
let db: Database.Database;
let dbInitialized = false;

// 获取数据库连接
export const getDb = (): Database.Database => {
  if (!db) {
    console.log('[数据库] 初始化数据库连接...');
    try {
      db = new Database(DB_PATH);
      
      // 启用WAL模式提高并发性能
      db.pragma('journal_mode = WAL');
      
      // 初始化表结构
      if (!dbInitialized) {
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
          
          -- 添加需求ID索引，用于加速ID搜索
          CREATE INDEX IF NOT EXISTS idx_demand_records_demand_id
          ON demand_records(demand_id);
          
          -- 检查是否支持FTS5
          PRAGMA compile_options;
        `);
        
        // 检查是否启用了FTS5支持
        const fts5Enabled = db.prepare("SELECT count(*) as count FROM pragma_compile_options WHERE compile_options LIKE 'ENABLE_FTS5'").get() as { count: number };
        
        if (fts5Enabled.count > 0) {
          try {
            // 创建全文搜索虚拟表
            db.exec(`
              -- 创建FTS5虚拟表用于全文搜索
              CREATE VIRTUAL TABLE IF NOT EXISTS demand_records_fts USING fts5(
                description,
                content='demand_records',
                content_rowid='rowid'
              );
              
              -- 检查触发器是否存在，如果不存在则创建
              CREATE TRIGGER IF NOT EXISTS demand_records_ai AFTER INSERT ON demand_records BEGIN
                INSERT INTO demand_records_fts(rowid, description) VALUES (new.rowid, new.description);
              END;
              
              CREATE TRIGGER IF NOT EXISTS demand_records_ad AFTER DELETE ON demand_records BEGIN
                INSERT INTO demand_records_fts(demand_records_fts, rowid, description) VALUES('delete', old.rowid, old.description);
              END;
              
              CREATE TRIGGER IF NOT EXISTS demand_records_au AFTER UPDATE ON demand_records BEGIN
                INSERT INTO demand_records_fts(demand_records_fts, rowid, description) VALUES('delete', old.rowid, old.description);
                INSERT INTO demand_records_fts(rowid, description) VALUES (new.rowid, new.description);
              END;
            `);
            console.log('[数据库] FTS5全文搜索索引初始化完成');
          } catch (error) {
            console.error('[数据库] FTS5初始化失败:', error);
            console.log('[数据库] 将使用LIKE查询代替全文搜索');
          }
        } else {
          console.log('[数据库] 数据库不支持FTS5，将使用LIKE查询代替全文搜索');
        }
        
        dbInitialized = true;
        console.log('[数据库] 数据库连接初始化完成');
      }
    } catch (error) {
      console.error('[数据库] 初始化数据库连接失败:', error);
      
      // 如果错误包含损坏相关词语，尝试修复
      const errorStr = String(error).toLowerCase();
      if (errorStr.includes('corrupt') || errorStr.includes('malformed')) {
        console.log('[数据库] 检测到数据库可能已损坏，尝试修复...');
        return handleCorruptedDatabase();
      }
      
      throw error;
    }
  }
  
  return db;
};

// 执行查询并返回所有结果
export const query = <T>(sql: string, params: any[] = []): T[] => {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  } catch (error) {
    console.error('[数据库] 查询执行失败:', error);
    
    // 检查是否是数据库损坏错误
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('corrupt') || errorStr.includes('malformed')) {
      console.log('[数据库] 查询时检测到数据库可能已损坏，尝试修复...');
      handleCorruptedDatabase();
    }
    
    return [];
  }
};

// 执行查询并返回单个结果
export const queryOne = <T>(sql: string, params: any[] = []): T | null => {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T || null;
  } catch (error) {
    console.error('[数据库] 查询执行失败:', error);
    
    // 检查是否是数据库损坏错误
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('corrupt') || errorStr.includes('malformed')) {
      console.log('[数据库] 查询时检测到数据库可能已损坏，尝试修复...');
      handleCorruptedDatabase();
    }
    
    return null;
  }
};

// 执行更新操作并返回影响的行数
export const execute = (sql: string, params: any[] = []): number => {
  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result.changes;
  } catch (error) {
    console.error('[数据库] 执行更新失败:', error);
    
    // 检查是否是数据库损坏错误
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('corrupt') || errorStr.includes('malformed')) {
      console.log('[数据库] 更新时检测到数据库可能已损坏，尝试修复...');
      handleCorruptedDatabase();
      
      // 重新尝试执行
      try {
        const db = getDb();
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return result.changes;
      } catch (retryError) {
        console.error('[数据库] 修复后重试执行更新失败:', retryError);
      }
    }
    
    return 0;
  }
};

// 执行事务
export const transaction = <T>(fn: () => T): T => {
  const db = getDb();
  
  try {
    // 开始事务
    db.exec('BEGIN TRANSACTION');
    
    // 执行事务函数
    const result = fn();
    
    // 提交事务
    db.exec('COMMIT');
    
    return result;
  } catch (error) {
    // 发生错误时回滚事务
    try {
      db.exec('ROLLBACK');
      console.error('[数据库] 事务已回滚:', error);
    } catch (rollbackError) {
      console.error('[数据库] 事务回滚失败:', rollbackError);
    }
    
    // 检查是否是数据库损坏错误
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('corrupt') || errorStr.includes('malformed')) {
      console.log('[数据库] 事务中检测到数据库可能已损坏，尝试修复...');
      handleCorruptedDatabase();
    }
    
    throw error;
  }
}; 