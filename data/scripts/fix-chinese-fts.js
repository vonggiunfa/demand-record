#!/usr/bin/env node

/**
 * 中文全文搜索修复脚本
 * 用于解决中文描述内容搜索无法返回数据的问题
 * 
 * 此脚本会：
 * 1. 删除现有FTS表
 * 2. 使用适合中文搜索的tokenize选项重建FTS表
 * 3. 重新索引所有现有描述数据
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
  const backupPath = path.join(BACKUP_DIR, `demands_before_chinese_fts_fix_${timestamp}.db`);
  
  console.log(`[中文FTS修复] 备份数据库到 ${backupPath}`);
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
  
  console.log('[中文FTS修复] 数据库备份完成');
}

// 修复中文FTS索引
function fixChineseFTS() {
  console.log('[中文FTS修复] 开始修复中文全文搜索...');
  
  const db = new Database(DB_PATH);
  
  try {
    // 检查是否支持FTS5
    const fts5Enabled = db.prepare("SELECT count(*) as count FROM pragma_compile_options WHERE compile_options LIKE 'ENABLE_FTS5'").get();
    
    if (fts5Enabled.count === 0) {
      console.log('[中文FTS修复] 数据库不支持FTS5，无法创建全文搜索索引');
      return;
    }
    
    // 检查表是否存在
    const tableExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records'").get();
    
    if (tableExists.count === 0) {
      console.log('[中文FTS修复] demand_records表不存在，无法创建FTS索引');
      return;
    }
    
    // 统计记录数
    const recordCount = db.prepare("SELECT count(*) as count FROM demand_records").get();
    console.log(`[中文FTS修复] 现有需求记录数量: ${recordCount.count}`);
    
    // 检查FTS表是否存在
    const ftsExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='demand_records_fts'").get();
    
    // 开始事务
    db.exec('BEGIN TRANSACTION');
    
    if (ftsExists.count > 0) {
      console.log('[中文FTS修复] 删除现有FTS表...');
      db.exec('DROP TABLE IF EXISTS demand_records_fts');
    }
    
    console.log('[中文FTS修复] 创建适用于中文搜索的FTS虚拟表...');
    db.exec(`
      -- 创建适用于中文的FTS5虚拟表
      CREATE VIRTUAL TABLE demand_records_fts USING fts5(
        description,
        content='demand_records',
        content_rowid='rowid',
        tokenize='unicode61'
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
    
    console.log('[中文FTS修复] 重新索引现有数据...');
    
    // 重新索引现有数据
    db.exec(`
      INSERT INTO demand_records_fts(rowid, description)
      SELECT rowid, description FROM demand_records
    `);
    
    // 验证索引是否成功
    const indexedCount = db.prepare("SELECT count(*) as count FROM demand_records_fts").get();
    console.log(`[中文FTS修复] 已索引 ${indexedCount.count} 条记录`);
    
    // 测试几种中文搜索方式
    const testQueries = ["报表", "报表*", "%报表%"];
    
    for (const query of testQueries) {
      try {
        const testResult = db.prepare(`
          SELECT COUNT(*) as count 
          FROM demand_records_fts 
          WHERE description MATCH ?
        `).get(query);
        
        console.log(`[中文FTS修复] 测试查询 "${query}" 匹配记录数: ${testResult.count}`);
      } catch (error) {
        console.error(`[中文FTS修复] 测试查询 "${query}" 失败:`, error.message);
      }
    }
    
    // 测试一些具体内容
    try {
      console.log('[中文FTS修复] 查看主表中包含"报表"的前3条记录:');
      
      const likeResults = db.prepare(`
        SELECT description 
        FROM demand_records 
        WHERE description LIKE '%报表%' 
        LIMIT 3
      `).all();
      
      likeResults.forEach((row, i) => {
        console.log(`  ${i+1}. ${row.description}`);
      });
      
      console.log('[中文FTS修复] 使用MATCH查询尝试搜索同样的记录:');
      
      const matchResults = db.prepare(`
        SELECT demand_records.description 
        FROM demand_records 
        JOIN demand_records_fts ON demand_records.rowid = demand_records_fts.rowid 
        WHERE demand_records_fts.description MATCH '报表' 
        LIMIT 3
      `).all();
      
      if (matchResults.length > 0) {
        matchResults.forEach((row, i) => {
          console.log(`  ${i+1}. ${row.description}`);
        });
      } else {
        console.log('  没有找到匹配记录，尝试更新服务代码中的查询方式');
      }
    } catch (error) {
      console.error('[中文FTS修复] 测试查询报表失败:', error.message);
    }
    
    // 提交事务
    db.exec('COMMIT');
    
    console.log('[中文FTS修复] 修改搜索服务代码中的查询方式:');
    console.log('1. 请修改 lib/demandService.ts 中的 searchByDescription 函数，使用以下查询:');
    console.log(`
      // 使用简单的单词搜索，不要使用复杂的引号和通配符
      const ftsQuery = term;  // 简单使用搜索词，不添加额外语法
    `);
    
    console.log('[中文FTS修复] 中文全文搜索索引修复完成');
    
    // 执行ANALYZE以优化查询
    db.exec('ANALYZE');
    
  } catch (error) {
    // 出错时回滚
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('[中文FTS修复] 回滚失败:', rollbackError);
    }
    
    console.error('[中文FTS修复] 修复中文FTS索引失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    db.close();
  }
}

// 主函数
function main() {
  console.log('========================================');
  console.log('开始修复中文全文搜索');
  console.log('========================================');
  
  try {
    // 1. 备份数据库
    backupDatabase();
    
    // 2. 执行修复
    fixChineseFTS();
    
    console.log('========================================');
    console.log('中文FTS索引修复完成!');
    console.log('========================================');
  } catch (error) {
    console.error('中文FTS索引修复失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 