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

### 2. 保存需求记录

保存指定年月的需求记录数据。

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
  }
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "数据保存成功，共保存 10 条记录",
  "recordCount": 10
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

### 3. 获取可用年月列表

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
    }
  })
});

const saveResult = await saveResponse.json();
console.log(saveResult.message);
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