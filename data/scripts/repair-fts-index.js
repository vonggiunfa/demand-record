#!/usr/bin/env node

/**
 * FTS全文搜索索引修复脚本
 * 用于解决描述内容搜索无法返回数据的问题
 * 
 * 此脚本会：
 * 1. 检查FTS5是否支持
 * 2. 删除现有FTS表（如果存在）
 * 3. 重新创建FTS表和触发器
 * 4. 重新索引所有现有描述数据
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
  const backupPath = path.join(BACKUP_DIR, `demands_before_fts_repair_${timestamp}.db`);
  
  console.log(`[FTS修复] 备份数据库到 ${backupPath}`);
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
  
  console.log('[FTS修复] 数据库备份完成');
}

// 修复FTS索引
function repairFtsIndex() {
  console.log('[FTS修复] 开始修复FTS全文搜索索引...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 检查是否支持FTS5
    const fts5Enabled = db.prepare("SELECT count(*) as count FROM pragma_compile_options WHERE compile_options LIKE 'ENABLE_FTS5'").get();
    
    if (fts5Enabled.count === 0) {
      console.log('[FTS修复] 数据库不支持FTS5，无法创建全文搜索索引');
      return;
    }
    
    // 检查表是否存在
    const tableExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records'").get();
    
    if (tableExists.count === 0) {
      console.log('[FTS修复] demand_records表不存在，无法创建FTS索引');
      return;
    }
    
    // 统计记录数
    const recordCount = db.prepare("SELECT count(*) as count FROM demand_records").get();
    console.log(`[FTS修复] 现有需求记录数量: ${recordCount.count}`);
    
    // 检查FTS表是否存在
    const ftsExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records_fts'").get();
    
    // 开始事务
    db.exec('BEGIN TRANSACTION');
    
    if (ftsExists.count > 0) {
      console.log('[FTS修复] 删除现有FTS表...');
      db.exec('DROP TABLE IF EXISTS demand_records_fts');
    }
    
    console.log('[FTS修复] 创建FTS虚拟表...');
    db.exec(`
      -- 创建FTS5虚拟表用于全文搜索
      CREATE VIRTUAL TABLE demand_records_fts USING fts5(
        description,
        content='demand_records',
        content_rowid='rowid'
      );
      
      -- 创建触发器
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
    
    console.log('[FTS修复] 重新索引现有数据...');
    // 统计记录数
    const beforeCount = db.prepare("SELECT count(*) as count FROM demand_records").get();
    console.log(`[FTS修复] 索引前记录数量: ${beforeCount.count}`);
    
    // 重新索引现有数据
    db.exec(`
      INSERT INTO demand_records_fts(rowid, description)
      SELECT rowid, description FROM demand_records
    `);
    
    // 验证索引是否成功
    const indexedCount = db.prepare("SELECT count(*) as count FROM demand_records_fts").get();
    console.log(`[FTS修复] 已索引 ${indexedCount.count} 条记录`);
    
    // 执行测试查询
    const testQuery = "测试";
    const testResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM demand_records_fts 
      WHERE description MATCH ?
    `).get(testQuery);
    
    console.log(`[FTS修复] 测试查询 "${testQuery}" 匹配记录数: ${testResult.count}`);
    
    // 提交事务
    db.exec('COMMIT');
    
    console.log('[FTS修复] FTS索引修复完成');
    
    // 执行ANALYZE以优化查询
    db.exec('ANALYZE');
    
  } catch (error) {
    // 出错时回滚
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('[FTS修复] 回滚失败:', rollbackError);
    }
    
    console.error('[FTS修复] 修复FTS索引失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 主函数
function main() {
  console.log('========================================');
  console.log('开始修复FTS全文搜索索引');
  console.log('========================================');
  
  try {
    // 1. 备份数据库
    backupDatabase();
    
    // 2. 执行修复
    repairFtsIndex();
    
    console.log('========================================');
    console.log('FTS索引修复成功!');
    console.log('========================================');
  } catch (error) {
    console.error('FTS索引修复失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 