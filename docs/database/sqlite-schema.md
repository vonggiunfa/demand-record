# SQLite 数据库模式

## 概述

需求记录系统使用 SQLite 数据库进行数据持久化存储。本文档描述了数据库表结构、索引和数据类型设计。

## 数据库文件

- **文件位置**: `data/demands.db`
- **引擎**: SQLite 3
- **配置模式**: WAL (Write-Ahead Logging)

## 表结构

### 需求记录表 (demand_records)

需求记录的主表，存储所有需求记录数据。

```sql
CREATE TABLE demand_records (
  id TEXT PRIMARY KEY,
  demand_id TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  year_month TEXT NOT NULL
);
```

#### 字段说明

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | TEXT | 是 | 记录唯一标识，主键 |
| demand_id | TEXT | 否 | 需求ID，用户可编辑 |
| description | TEXT | 否 | 需求描述，用户可编辑 |
| created_at | TEXT | 是 | 创建时间，ISO格式字符串 |
| year_month | TEXT | 是 | 年月标识，格式为YYYY-MM |

#### 索引

```sql
-- 按年月索引，用于加速查询
CREATE INDEX idx_demand_records_year_month ON demand_records(year_month);
```

## 数据转换

系统在前端数据模型和数据库模型之间进行自动转换：

### 前端到数据库

```javascript
// 前端模型示例
const frontendRecord = {
  id: "abc123",
  demandId: "DEMAND-001",
  description: "实现登录功能",
  createdAt: new Date("2023-12-10T09:00:00Z")
};

// 转换为数据库模型
const dbRecord = {
  id: frontendRecord.id,
  demand_id: frontendRecord.demandId,
  description: frontendRecord.description,
  created_at: frontendRecord.createdAt.toISOString(),
  year_month: "2023-12" // 从createdAt提取
};
```

### 数据库到前端

```javascript
// 数据库记录示例
const dbRecord = {
  id: "abc123",
  demand_id: "DEMAND-001",
  description: "实现登录功能",
  created_at: "2023-12-10T09:00:00.000Z",
  year_month: "2023-12"
};

// 转换为前端模型
const frontendRecord = {
  id: dbRecord.id,
  demandId: dbRecord.demand_id,
  description: dbRecord.description,
  createdAt: new Date(dbRecord.created_at)
};
```

## 查询示例

### 获取特定年月的记录

```sql
SELECT id, demand_id, description, created_at 
FROM demand_records 
WHERE year_month = '2023-12'
ORDER BY created_at DESC;
```

### 获取所有可用年月

```sql
SELECT DISTINCT year_month 
FROM demand_records 
ORDER BY year_month DESC;
```

### 插入新记录

```sql
INSERT INTO demand_records (id, demand_id, description, created_at, year_month)
VALUES (?, ?, ?, ?, ?);
```

### 批量更新特定年月的记录

使用事务确保原子性操作：

```sql
BEGIN TRANSACTION;

-- 删除原有的该年月记录
DELETE FROM demand_records WHERE year_month = ?;

-- 插入新记录
INSERT INTO demand_records (id, demand_id, description, created_at, year_month)
VALUES (?, ?, ?, ?, ?);
-- 重复插入多条...

COMMIT;
```

## 性能注意事项

1. **索引使用**: 确保按年月查询时使用了索引
2. **事务处理**: 批量操作使用事务提高性能和一致性
3. **WAL模式**: 提高并发性能，减少写操作阻塞
4. **查询优化**: 只选择需要的字段，避免`SELECT *`

## 维护建议

1. **定期备份**: 定期备份数据库文件
2. **检查点操作**: 在应用负载低时执行WAL检查点操作
3. **索引维护**: 定期重建索引以保持最佳性能
4. **数据库体积监控**: 监控数据库大小，避免过大影响性能 