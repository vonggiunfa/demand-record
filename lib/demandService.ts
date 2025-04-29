import { DemandRecord } from '@/types/demand';
import { execute, getDb, query, queryOne, transaction } from './db';

// 将对象属性转换为下划线命名
const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (key === 'createdAt' && obj[key] instanceof Date) {
        // 日期转为ISO字符串
        result[snakeKey] = obj[key].toISOString();
      } else {
        result[snakeKey] = obj[key];
      }
    }
  }
  return result;
};

// 将下划线命名转换为驼峰命名
const toCamelCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      if (key === 'created_at' && typeof obj[key] === 'string') {
        // ISO字符串转为Date对象
        result[camelKey] = new Date(obj[key]);
      } else {
        result[camelKey] = obj[key];
      }
    }
  }
  return result;
};

// 根据月份获取需求记录
export const getDemandsByMonth = (month: string): DemandRecord[] => {
  console.log(`尝试获取月份 [${month}] 的需求记录`);
  
  try {
    // 确保查询条件正确
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      console.error(`无效的月份格式: ${month}`);
      return [];
    }
    
    // 查询指定月份的记录，输出SQL用于调试
    const sql = `
      SELECT id, demand_id, description, created_at
      FROM demand_records
      WHERE month = ?
      ORDER BY created_at DESC
    `;
    console.log(`执行SQL查询: ${sql.trim().replace(/\s+/g, ' ')}, 参数: [${month}]`);
    
    const records = query<any>(sql, [month]);
    console.log(`月份 [${month}] 查询结果: ${records.length} 条记录`);
    
    // 调试前5条记录
    if (records.length > 0) {
      console.log(`月份 [${month}] 的部分记录:`, JSON.stringify(records.slice(0, 5), null, 2));
    }
    
    return records.map(record => toCamelCase(record)) as DemandRecord[];
  } catch (error) {
    console.error(`获取月份 [${month}] 的需求记录失败:`, error);
    return [];
  }
};

// 保存需求记录（批量保存，使用事务）
export const saveDemands = (demands: DemandRecord[], month: string): boolean => {
  console.log(`[调试] 开始保存 ${demands.length} 条记录到月份 "${month}"`);
  
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error(`[错误] 无效的月份格式: "${month}"`);
    return false;
  }
  
  try {
    return transaction(() => {
      try {
        // 清除当前月份的记录
        console.log(`[调试] 清除月份 "${month}" 的现有记录`);
        const deleteResult = execute('DELETE FROM demand_records WHERE month = ?', [month]);
        console.log(`[调试] 删除了 ${deleteResult} 条现有记录`);
        
        // 准备批量插入的语句
        const insertStmt = getDb().prepare(`
          INSERT INTO demand_records (id, demand_id, description, created_at, month)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        // 执行批量插入
        let insertedCount = 0;
        for (const demand of demands) {
          // 将驼峰命名的字段转换为蛇形命名
          const record = toSnakeCase(demand) as any;
          
          insertStmt.run(
            demand.id,
            demand.demandId || '',
            demand.description || '',
            demand.createdAt instanceof Date ? demand.createdAt.toISOString() : new Date().toISOString(),
            month
          );
          insertedCount++;
          
          // 每100条记录输出一次日志
          if (insertedCount % 100 === 0) {
            console.log(`[调试] 已插入 ${insertedCount}/${demands.length} 条记录`);
          }
        }
        
        console.log(`[调试] 成功插入 ${insertedCount} 条记录到月份 "${month}"`);
        
        // 验证插入后的记录数
        const recordCount = queryOne<{count: number}>('SELECT COUNT(*) as count FROM demand_records WHERE month = ?', [month]);
        console.log(`[调试] 月份 "${month}" 现有记录数: ${recordCount?.count || 0}`);
        
        // 如果是空记录列表，则只需确认数据库中没有记录即可
        if (demands.length === 0) {
          if (recordCount && recordCount.count === 0) {
            return true;
          } else {
            console.error(`[错误] 清空记录失败: 期望 0 条记录, 实际 ${recordCount?.count || 0}`);
            throw new Error('清空记录后数据库仍有残留记录');
          }
        }
        
        // 非空记录列表的验证逻辑不变
        if (recordCount && recordCount.count === demands.length) {
          return true;
        } else {
          console.error(`[错误] 记录数不匹配: 期望 ${demands.length}, 实际 ${recordCount?.count || 0}`);
          throw new Error('保存后记录数不匹配');
        }
      } catch (error) {
        console.error(`[错误] 保存需求记录事务内部失败:`, error);
        throw error; // 确保事务回滚
      }
    });
  } catch (error) {
    console.error(`[错误] 保存需求记录失败:`, error);
    return false;
  }
};

// 获取所有可用的月份
export const getAvailableMonths = (): string[] => {
  const months = query<{ month: string }>(`
    SELECT DISTINCT month FROM demand_records
    ORDER BY month DESC
  `);
  
  return months.map(m => m.month);
};

// 检查是否支持FTS5全文搜索
const isFTS5Available = (): boolean => {
  const db = getDb();
  try {
    // 检查FTS5虚拟表是否存在
    const result = queryOne<{count: number}>(`
      SELECT count(*) as count FROM sqlite_master 
      WHERE type='table' AND name='demand_records_fts'
    `);
    return result?.count === 1;
  } catch (error) {
    console.error('[搜索] FTS5可用性检查失败:', error);
    return false;
  }
};

// 搜索接口返回类型
export interface SearchResult {
  records: DemandRecord[];
  total: number;
  hasMore: boolean;
}

// 搜索需求ID
export const searchByDemandId = (term: string, limit: number = 20, offset: number = 0): SearchResult => {
  console.log(`[搜索] 按需求ID搜索: "${term}", limit=${limit}, offset=${offset}`);
  
  try {
    // 使用LIKE模糊匹配
    const searchTerm = `%${term}%`;
    
    // 查询匹配记录
    const sql = `
      SELECT id, demand_id, description, created_at
      FROM demand_records
      WHERE demand_id LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const records = query<any>(sql, [searchTerm, limit, offset]);
    
    // 查询总匹配数
    const totalResult = queryOne<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM demand_records 
      WHERE demand_id LIKE ?
    `, [searchTerm]);
    
    const total = totalResult?.count || 0;
    
    console.log(`[搜索] 按需求ID "${term}" 找到 ${total} 条匹配记录，当前返回 ${records.length} 条`);
    
    return {
      records: records.map(record => toCamelCase(record)) as DemandRecord[],
      total,
      hasMore: offset + records.length < total
    };
  } catch (error) {
    console.error(`[搜索] 按需求ID搜索失败:`, error);
    return { records: [], total: 0, hasMore: false };
  }
};

// 搜索描述内容
export const searchByDescription = (term: string, limit: number = 20, offset: number = 0): SearchResult => {
  console.log(`[搜索] 按描述搜索: "${term}", limit=${limit}, offset=${offset}`);
  
  try {
    let records: any[] = [];
    let total = 0;
    
    if (isFTS5Available()) {
      console.log(`[搜索] 使用FTS5全文搜索`);
      
      // 使用FTS5全文搜索
      const ftsQuery = term.split(/\s+/).map(word => `"${word}"*`).join(' AND ');
      
      // 查询匹配记录
      const sql = `
        SELECT demand_records.id, demand_records.demand_id, demand_records.description, demand_records.created_at
        FROM demand_records_fts
        JOIN demand_records ON demand_records_fts.rowid = demand_records.rowid
        WHERE demand_records_fts.description MATCH ?
        ORDER BY demand_records.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      records = query<any>(sql, [ftsQuery, limit, offset]);
      
      // 查询总匹配数
      const totalResult = queryOne<{count: number}>(`
        SELECT COUNT(*) as count 
        FROM demand_records_fts 
        WHERE description MATCH ?
      `, [ftsQuery]);
      
      total = totalResult?.count || 0;
    } else {
      console.log(`[搜索] 使用LIKE模糊搜索`);
      
      // 使用LIKE模糊匹配（作为备选方案）
      const searchTerm = `%${term}%`;
      
      // 查询匹配记录
      const sql = `
        SELECT id, demand_id, description, created_at
        FROM demand_records
        WHERE description LIKE ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      records = query<any>(sql, [searchTerm, limit, offset]);
      
      // 查询总匹配数
      const totalResult = queryOne<{count: number}>(`
        SELECT COUNT(*) as count 
        FROM demand_records 
        WHERE description LIKE ?
      `, [searchTerm]);
      
      total = totalResult?.count || 0;
    }
    
    console.log(`[搜索] 按描述内容 "${term}" 找到 ${total} 条匹配记录，当前返回 ${records.length} 条`);
    
    return {
      records: records.map(record => toCamelCase(record)) as DemandRecord[],
      total,
      hasMore: offset + records.length < total
    };
  } catch (error) {
    console.error(`[搜索] 按描述内容搜索失败:`, error);
    return { records: [], total: 0, hasMore: false };
  }
}; 