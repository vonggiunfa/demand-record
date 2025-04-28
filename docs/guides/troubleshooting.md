# 故障排除指南

本文档记录了需求记录系统开发过程中遇到的常见问题及其解决方案，旨在帮助开发者快速定位和解决类似问题。

## Next.js App Router 相关问题

### 1. 客户端组件（Client Components）错误

#### 问题描述

在使用 Next.js App Router 模式开发时，项目启动后出现以下错误：

```
Error: You're importing a component that needs `useEffect`. This React hook only works in a client component. 
To fix, mark the file (or its parent) with the `"use client"` directive.
```

类似的错误还包括 `useState`、`useRef` 等 React Hooks。

#### 原因分析

在 Next.js 13+ 的 App Router 模式下，所有组件默认都是**服务器组件（Server Components）**，而服务器组件中不能使用 React Hooks（如 `useState`、`useEffect`、`useRef` 等）。

当组件中使用了这些 hooks 时，需要将组件显式标记为**客户端组件（Client Components）**。

#### 解决方案

在组件文件的顶部添加 `"use client"` 指令，将组件标记为客户端组件：

```tsx
"use client";

import { useState, useEffect } from 'react';
// 其他导入...

export default function MyComponent() {
  const [state, setState] = useState(initialState);
  // 组件逻辑...
}
```

在本项目中，我们为以下组件添加了 `"use client"` 指令：

- `components/DemandRecordTable.tsx`
- `components/MonthYearPicker.tsx`

### 2. API 请求路径问题

#### 问题描述

组件中的 API 请求返回 404 错误，无法找到对应的 API 端点。

#### 原因分析

项目的 `next.config.mjs` 文件中配置了 `basePath: '/demand-record'`，这意味着所有的路由（包括 API 路由）都会添加这个前缀。

但在客户端组件中，API 请求的 URL 没有包含这个前缀，导致请求发送到了错误的路径。

```javascript
// 错误的 API 请求
const response = await fetch('/api/year-months');

// 正确的 API 请求
const response = await fetch('/demand-record/api/year-months');
```

#### 解决方案

在客户端组件中，添加一个常量用于存储 API 基础路径，然后在所有 API 请求中使用这个常量：

```tsx
// 获取 API 基础路径
const API_BASE_PATH = '/demand-record';

// 使用带有基础路径的 API 请求
const response = await fetch(`${API_BASE_PATH}/api/year-months`);
```

在本项目中，我们修改了 `components/DemandRecordTable.tsx` 文件中的所有 API 请求，添加了 `API_BASE_PATH` 前缀。

## 数据库相关问题

### 1. 数据库文件目录不存在

#### 问题描述

应用启动后，尝试创建或访问数据库文件时可能会遇到 "目录不存在" 的错误。

#### 原因分析

SQLite 数据库需要一个物理文件来存储数据，但如果该文件所在的目录不存在，则会导致数据库操作失败。

#### 解决方案

在应用启动前，确保数据目录存在。在本项目中，我们在 `lib/db.ts` 文件中添加了以下代码：

```typescript
// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
```

同时，在部署前也可以手动创建数据目录：

```bash
mkdir -p data
```

## 依赖项问题

### 1. 缺少必要的依赖项

#### 问题描述

应用启动时报错，提示找不到某些模块，如 `better-sqlite3` 或 `uuid`。

#### 原因分析

项目使用了某些依赖项，但这些依赖项尚未安装或未正确安装。

#### 解决方案

使用 npm 安装缺少的依赖项：

```bash
# 安装 SQLite 数据库驱动
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3

# 安装 UUID 生成工具
npm install uuid @types/uuid
```

## 最佳实践建议

为避免未来出现类似问题，建议遵循以下最佳实践：

1. **客户端组件标记**：在使用 React Hooks 的组件顶部始终添加 `"use client"` 指令

2. **API 路径管理**：创建一个统一的工具函数或常量来管理 API 路径，确保正确处理 `basePath`

3. **环境检查**：在应用启动时检查必要的目录和文件是否存在，如不存在则创建

4. **依赖清单**：维护一个明确的项目依赖清单，确保所有必要的依赖都被正确安装

5. **错误日志**：实现全面的错误日志记录，便于快速定位和解决问题

## 相关资源

- [Next.js App Router 文档](https://nextjs.org/docs/app)
- [Next.js 客户端组件](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js 配置选项](https://nextjs.org/docs/app/api-reference/next-config-js)
- [SQLite 官方文档](https://www.sqlite.org/docs.html) 