#!/usr/bin/env node

/**
 * 数据库迁移脚本：将demand_records表中的month字段迁移到year_month字段
 * 
 * 执行步骤：
 * 1. 备份现有数据
 * 2. 创建临时表
 * 3. 复制数据（month -> year_month）
 * 4. 删除旧表
 * 5. 重命名临时表
 * 6. 重建索引
 * 7. 重建FTS5全文搜索表（如果存在）
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 数据库路径
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'demands.db');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// 创建备份目录（如果不存在）
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 备份数据库
function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const backupPath = path.join(BACKUP_DIR, `demands_before_migration_${timestamp}.db`);
  
  console.log(`[迁移] 备份数据库到 ${backupPath}`);
  fs.copyFileSync(DB_PATH, backupPath);
  
  // 备份WAL和SHM文件（如果存在）
  const walPath = `${DB_PATH}-wal`;
  const shmPath = `${DB_PATH}-shm`;
  
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, `${backupPath}-wal`);
  }
  
  if (fs.existsSync(shmPath)) {
    fs.copyFileSync(shmPath, `${backupPath}-shm`);
  }
  
  console.log('[迁移] 数据库备份完成');
}

// 执行迁移
function migrateDatabase() {
  console.log('[迁移] 开始数据库字段迁移...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 检查表是否存在
    const tableExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records'").get();
    
    if (tableExists.count === 0) {
      console.log('[迁移] demand_records表不存在，无需迁移');
      return;
    }
    
    // 检查字段是否已经迁移
    const columns = db.prepare("PRAGMA table_info(demand_records)").all();
    const hasMonthColumn = columns.some(col => col.name === 'month');
    const hasYearMonthColumn = columns.some(col => col.name === 'year_month');
    
    if (!hasMonthColumn && hasYearMonthColumn) {
      console.log('[迁移] 字段已经是year_month，无需迁移');
      return;
    }
    
    if (hasMonthColumn && hasYearMonthColumn) {
      console.log('[迁移] 两个字段都存在，可能之前迁移未完成，继续迁移');
    }
    
    // 开始事务
    db.exec('BEGIN TRANSACTION');
    
    // 检查是否有FTS表
    const hasFts = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records_fts'").get();
    
    // 1. 创建临时表
    console.log('[迁移] 创建临时表...');
    db.exec(`
      CREATE TABLE demand_records_temp (
        id TEXT PRIMARY KEY,
        demand_id TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        year_month TEXT NOT NULL
      );
    `);
    
    // 2. 复制数据
    console.log('[迁移] 复制数据...');
    let migrationQuery;
    
    if (hasMonthColumn && !hasYearMonthColumn) {
      // month -> year_month
      migrationQuery = `
        INSERT INTO demand_records_temp
        SELECT id, demand_id, description, created_at, month as year_month
        FROM demand_records
      `;
    } else if (hasMonthColumn && hasYearMonthColumn) {
      // 两者都有，使用year_month
      migrationQuery = `
        INSERT INTO demand_records_temp
        SELECT id, demand_id, description, created_at, year_month
        FROM demand_records
      `;
    }
    
    db.exec(migrationQuery);
    
    // 获取复制的记录数
    const recordCount = db.prepare("SELECT count(*) as count FROM demand_records_temp").get();
    console.log(`[迁移] 复制了 ${recordCount.count} 条记录`);
    
    // 3. 删除旧表
    console.log('[迁移] 删除旧表...');
    db.exec('DROP TABLE demand_records');
    
    // 4. 重命名临时表
    console.log('[迁移] 重命名临时表...');
    db.exec('ALTER TABLE demand_records_temp RENAME TO demand_records');
    
    // 5. 重建索引
    console.log('[迁移] 重建索引...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_demand_records_year_month 
      ON demand_records(year_month);
      
      CREATE INDEX IF NOT EXISTS idx_demand_records_demand_id
      ON demand_records(demand_id);
    `);
    
    // 6. 如果存在FTS表，重建它
    if (hasFts.count > 0) {
      console.log('[迁移] 重建全文搜索索引...');
      
      // 删除旧的FTS表
      db.exec('DROP TABLE IF EXISTS demand_records_fts');
      
      // 创建新的FTS表
      db.exec(`
        CREATE VIRTUAL TABLE demand_records_fts USING fts5(
          description,
          content='demand_records',
          content_rowid='rowid'
        );
        
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
      
      // 重新索引现有数据
      db.exec(`
        INSERT INTO demand_records_fts(rowid, description)
        SELECT rowid, description FROM demand_records
      `);
    }
    
    // 提交事务
    db.exec('COMMIT');
    
    console.log('[迁移] 字段迁移完成');
  } catch (error) {
    // 出错时回滚
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('[迁移] 回滚失败:', rollbackError);
    }
    
    console.error('[迁移] 迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 主函数
function main() {
  console.log('========================================');
  console.log('开始迁移数据库: month -> year_month');
  console.log('========================================');
  
  try {
    // 1. 备份数据库
    backupDatabase();
    
    // 2. 执行迁移
    migrateDatabase();
    
    console.log('========================================');
    console.log('数据库迁移成功!');
    console.log('========================================');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 