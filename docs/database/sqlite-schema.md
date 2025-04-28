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

-- 按需求ID索引，用于加速ID搜索
CREATE INDEX idx_demand_records_demand_id ON demand_records(demand_id);

-- 按描述字段创建FTS5虚拟表，用于全文搜索
CREATE VIRTUAL TABLE demand_records_fts USING fts5(
  description,
  content='demand_records',
  content_rowid='rowid'
);

-- 定义触发器，保持FTS索引与主表同步
CREATE TRIGGER demand_records_ai AFTER INSERT ON demand_records BEGIN
  INSERT INTO demand_records_fts(rowid, description) VALUES (new.rowid, new.description);
END;

CREATE TRIGGER demand_records_ad AFTER DELETE ON demand_records BEGIN
  INSERT INTO demand_records_fts(demand_records_fts, rowid, description) VALUES('delete', old.rowid, old.description);
END;

CREATE TRIGGER demand_records_au AFTER UPDATE ON demand_records BEGIN
  INSERT INTO demand_records_fts(demand_records_fts, rowid, description) VALUES('delete', old.rowid, old.description);
  INSERT INTO demand_records_fts(rowid, description) VALUES (new.rowid, new.description);
END;
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

### 搜索查询

#### 按需求ID搜索

```sql
SELECT id, demand_id, description, created_at 
FROM demand_records 
WHERE demand_id LIKE '%' || ? || '%'
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

#### 按描述内容全文搜索

```sql
SELECT demand_records.id, demand_records.demand_id, demand_records.description, demand_records.created_at 
FROM demand_records_fts 
JOIN demand_records ON demand_records_fts.rowid = demand_records.rowid
WHERE demand_records_fts.description MATCH ?
ORDER BY demand_records.created_at DESC
LIMIT ? OFFSET ?;
```

#### 获取搜索结果总数

```sql
-- 按需求ID搜索的总数
SELECT COUNT(*) FROM demand_records WHERE demand_id LIKE '%' || ? || '%';

-- 按描述全文搜索的总数
SELECT COUNT(*) FROM demand_records_fts WHERE description MATCH ?;
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
5. **FTS5全文搜索**: 使用FTS5虚拟表实现高效的全文搜索
6. **搜索分页**: 在搜索API中实现分页，避免返回过多结果
7. **模糊匹配优化**: 针对LIKE查询，使用后缀索引或考虑限制通配符位置

## 搜索性能优化

全文搜索是资源密集型操作，SQLite中可通过以下方式优化：

1. **使用合适的FTS5标记器**:
   - 默认标记器适用于英文
   - 中文搜索建议使用`'tokenize=porter'`或自定义标记器

2. **降低I/O开销**:
   - 确保FTS5表的读写在WAL模式下进行
   - 考虑为频繁搜索的场景预热缓存

3. **优化全文搜索语法**:
   - 使用前缀搜索: `word*`
   - 使用NEAR运算符: `word1 NEAR word2`
   - 使用列限定符: `column:word`

4. **搜索结果缓存**:
   - 对于相同搜索词的查询实现结果缓存
   - 设置适当的缓存过期策略

## 维护建议

1. **定期备份**: 定期备份数据库文件
2. **检查点操作**: 在应用负载低时执行WAL检查点操作
3. **索引维护**: 定期重建索引以保持最佳性能
4. **数据库体积监控**: 监控数据库大小，避免过大影响性能 