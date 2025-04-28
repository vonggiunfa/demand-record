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
  
  return transaction(() => {
    try {
      // 清除当前月份的记录
      console.log(`[调试] 清除月份 "${month}" 的现有记录`);
      const deleteResult = execute('DELETE FROM demand_records WHERE month = ?', [month]);
      console.log(`[调试] 删除了 ${deleteResult} 条现有记录`);
      
      // 准备批量插入的语句
      const insertStmt = getDb().prepare(`
        INSERT INTO demand_records (id, demand_id, description, created_at, month)
        VALUES (@id, @demand_id, @description, @created_at, @month)
      `);
      
      // 执行批量插入
      let insertedCount = 0;
      for (const demand of demands) {
        const dbRecord = {
          ...toSnakeCase(demand),
          month
        };
        insertStmt.run(dbRecord);
        insertedCount++;
      }
      
      console.log(`[调试] 成功插入 ${insertedCount} 条记录到月份 "${month}"`);
      
      // 验证插入后的记录数
      const recordCount = queryOne<{count: number}>('SELECT COUNT(*) as count FROM demand_records WHERE month = ?', [month]);
      console.log(`[调试] 月份 "${month}" 现有记录数: ${recordCount?.count || 0}`);
      
      return true;
    } catch (error) {
      console.error(`[错误] 保存需求记录失败:`, error);
      return false;
    }
  });
};

// 获取所有可用的月份
export const getAvailableMonths = (): string[] => {
  const months = query<{ month: string }>(`
    SELECT DISTINCT month FROM demand_records
    ORDER BY month DESC
  `);
  
  return months.map(m => m.month);
}; 