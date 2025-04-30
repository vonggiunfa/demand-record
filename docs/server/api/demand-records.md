# 需求记录 API

本文档详细描述了需求记录系统提供的API端点、请求方式、参数和响应格式。

## 基础信息

- **基础URL**: `/api`
- **内容类型**: `application/json`
- **响应格式**: JSON

## API端点

### 1. 获取需求记录

获取指定年月的需求记录列表。

```
GET /api/load-data?yearMonth=YYYY-MM
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| yearMonth | string | 否 | 指定年月，格式为YYYY-MM。默认为当前年月 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "数据加载成功",
  "data": {
    "lastUpdated": "2023-12-15T08:30:00.000Z",
    "records": [
      {
        "id": "abc123",
        "demandId": "DEMAND-001",
        "description": "实现登录功能",
        "createdAt": "2023-12-10T09:00:00.000Z"
      },
      // ...更多记录
    ]
  }
}
```

#### 错误响应

##### 数据库错误 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "数据库操作失败",
  "error": "错误详情"
}
```

### 2. 获取所有需求记录

获取所有年月的需求记录，不受年月限制。主要用于导出全部数据。

```
GET /api/all-demands
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "所有数据加载成功",
  "data": {
    "lastUpdated": "2023-12-15T08:30:00.000Z",
    "records": [
      {
        "id": "abc123",
        "demandId": "DEMAND-001",
        "description": "实现登录功能",
        "createdAt": "2023-12-10T09:00:00.000Z"
      },
      // ...更多记录
    ]
  }
}
```

#### 错误响应

##### 数据库错误 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "加载所有数据失败",
  "error": "错误详情"
}
```

### 3. 保存需求记录

保存指定年月的需求记录数据，支持查重校验。只保存用户勾选的需求记录，系统会自动校验需求ID是否已存在。支持全量替换模式和增量保存模式。

```
POST /api/save-data
```

#### 请求体

```json
{
  "yearMonth": "2023-12",
  "data": {
    "lastUpdated": "2023-12-15T10:30:00.000Z",
    "records": [
      {
        "id": "abc123",
        "demandId": "DEMAND-001",
        "description": "实现登录功能",
        "createdAt": "2023-12-10T09:00:00.000Z"
      },
      // ...更多记录
    ]
  },
  "onlySelected": true // 标识只保存选中的记录
}
```

#### 请求参数说明

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| yearMonth | string | 是 | 年月标识，格式为YYYY-MM |
| data.lastUpdated | string | 是 | 最后更新时间，ISO格式字符串 |
| data.records | array | 是 | 需求记录数组 |
| onlySelected | boolean | 否 | 是否仅保存选中记录，默认为false |

#### 保存模式说明

API支持两种保存模式：

1. **全量替换模式** (`onlySelected=false`)：
   - 删除该月份的所有现有记录
   - 插入所有提交的新记录
   - 适用于完全替换月份数据的场景

2. **增量保存模式** (`onlySelected=true`)：
   - 检查记录ID是否已存在，如果存在则先删除
   - 保留该月份其他未提交的记录
   - 追加提交的新记录
   - 适用于导入历史数据、部分更新等场景

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "数据保存成功，共保存 10 条记录",
  "recordCount": 10
}
```

#### 重复记录响应 (200 OK, 但有重复记录信息)

```json
{
  "success": false,
  "message": "部分需求ID已存在，无法保存",
  "duplicateRecords": [
    {
      "demandId": "DEMAND-001",
      "description": "实现登录功能"
    }
  ]
}
```

#### 空记录保存/清空月份 (200 OK)

当提交的记录列表为空且`onlySelected`为`false`时，API会清空该月份所有记录：

```json
{
  "success": true,
  "message": "已清空 2023-12 的所有记录",
  "recordCount": 0
}
```

#### 错误响应

##### 请求格式错误 (400 Bad Request)

```json
{
  "success": false,
  "message": "请求参数无效",
  "error": "详细错误信息"
}
```

##### 数据库错误 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "保存数据失败",
  "error": "错误详情"
}
```

### 4. 获取可用年月列表

获取系统中所有已有数据的年月列表。

```
GET /api/year-months
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "年月列表获取成功",
  "yearMonths": ["2023-12", "2023-11", "2023-10"]
}
```

#### 错误响应

##### 数据库错误 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "获取年月列表失败",
  "error": "错误详情"
}
```

### 5. 搜索需求记录

跨年月搜索需求记录，支持按需求ID或描述内容进行搜索。

```
GET /api/search?term=XXX&type=id|description&limit=20&offset=0
```

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| term | string | 是 | 搜索关键词 |
| type | string | 是 | 搜索类型，可选值为"id"（需求ID）或"description"（描述内容） |
| limit | number | 否 | 限制返回记录数量，默认20 |
| offset | number | 否 | 分页偏移量，默认0 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "搜索完成",
  "data": {
    "records": [
      {
        "id": "abc123",
        "demandId": "DEMAND-001",
        "description": "实现登录功能",
        "createdAt": "2023-12-10T09:00:00.000Z"
      },
      // ...更多记录
    ],
    "total": 28,  // 总匹配记录数
    "hasMore": true  // 是否还有更多结果
  }
}
```

#### 错误响应

##### 请求参数错误 (400 Bad Request)

```json
{
  "success": false,
  "message": "搜索参数无效",
  "error": "type参数必须为'id'或'description'"
}
```

##### 数据库错误 (500 Internal Server Error)

```json
{
  "success": false,
  "message": "搜索失败",
  "error": "错误详情"
}
```

## 错误处理

所有API端点在遇到错误时将返回一个包含以下字段的JSON对象：

```json
{
  "success": false,
  "message": "用户友好的错误描述",
  "error": "详细的技术错误信息（仅在开发环境提供）"
}
```

## 状态码说明

| 状态码 | 描述 |
|-------|------|
| 200 | 请求成功 |
| 400 | 请求参数无效 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |

## 示例

### 加载数据示例

```javascript
// 加载2023年12月的数据
const response = await fetch('/api/load-data?yearMonth=2023-12');
const data = await response.json();

if (data.success) {
  console.log(`成功加载 ${data.data.records.length} 条记录`);
} else {
  console.error('加载失败:', data.message);
}
```

### 加载所有年月数据示例

```javascript
// 加载所有年月的数据
const response = await fetch('/api/all-demands');
const data = await response.json();

if (data.success) {
  console.log(`成功加载所有年月的 ${data.data.records.length} 条记录`);
} else {
  console.error('加载失败:', data.message);
}
```

### 保存数据示例

```javascript
// 保存数据
const saveResponse = await fetch('/api/save-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    yearMonth: '2023-12',
    data: { 
      lastUpdated: new Date().toISOString(),
      records: [/* 记录数组 */] 
    },
    onlySelected: true
  })
});

const saveResult = await saveResponse.json();

if (saveResult.success) {
  console.log(saveResult.message);
} else {
  // 处理错误情况
  if (saveResult.duplicateRecords) {
    console.error('保存失败：以下需求ID已存在：');
    saveResult.duplicateRecords.forEach(record => {
      console.error(`需求ID: ${record.demandId} - ${record.description}`);
    });
  } else {
    console.error('保存失败:', saveResult.message);
  }
}
```

### 导入历史数据示例

```javascript
// 从CSV导入历史数据
async function importHistoricalData(csvData) {
  // 1. 解析CSV数据
  const records = parseCSV(csvData);
  
  // 2. 按年月分组
  const recordsByMonth = {};
  records.forEach(record => {
    const date = new Date(record.createdAt);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!recordsByMonth[yearMonth]) {
      recordsByMonth[yearMonth] = [];
    }
    recordsByMonth[yearMonth].push(record);
  });
  
  // 3. 按月份逐个导入数据
  for (const [yearMonth, monthRecords] of Object.entries(recordsByMonth)) {
    // 4. 获取当前月份数据，用于去重
    const currentDataResponse = await fetch(`/api/load-data?yearMonth=${yearMonth}`);
    const currentData = await currentDataResponse.json();
    
    if (currentData.success) {
      // 5. 过滤掉已存在的记录（以demandId为准）
      const existingIds = new Set(currentData.data.records.map(r => r.demandId));
      const uniqueRecords = monthRecords.filter(r => !existingIds.has(r.demandId));
      
      // 6. 使用增量保存模式导入数据
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearMonth,
          data: {
            lastUpdated: new Date().toISOString(),
            records: uniqueRecords
          },
          onlySelected: true // 使用增量保存模式
        })
      });
    }
  }
}

// CSV解析辅助函数
function parseCSV(csvText) {
  // 实现CSV解析逻辑
  // ...
}
```

### 获取年月列表示例

```javascript
// 获取所有可用年月
const monthsResponse = await fetch('/api/year-months');
const monthsData = await monthsResponse.json();

if (monthsData.success) {
  console.log('可用年月:', monthsData.yearMonths);
} else {
  console.error('获取年月列表失败:', monthsData.message);
}
```

### 搜索数据示例

```javascript
// 搜索包含"登录"的需求描述
const searchResponse = await fetch('/api/search?term=登录&type=description');
const searchData = await searchResponse.json();

if (searchData.success) {
  console.log(`找到 ${searchData.data.total} 条匹配记录，当前显示 ${searchData.data.records.length} 条`);
  
  // 加载更多结果（如果有）
  if (searchData.data.hasMore) {
    const nextPageResponse = await fetch('/api/search?term=登录&type=description&offset=20');
    // 处理下一页结果...
  }
} else {
  console.error('搜索失败:', searchData.message);
}