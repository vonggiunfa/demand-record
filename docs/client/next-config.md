# Next.js 配置文档

## 概述

本文档详细介绍需求记录系统的 Next.js 配置，包括各项配置的作用、影响范围和注意事项。这些配置对前端组件的正常运行至关重要，特别是与API路径和静态资源相关的配置。

## 配置文件位置

配置文件位于项目根目录下的 `next.config.mjs`。这是一个 ECMAScript 模块格式的文件，使用标准的 JavaScript 导出语法。

## 主要配置项

以下是项目中使用的主要 Next.js 配置项及其说明：

### basePath

```javascript
basePath: '/demand-record'
```

**作用**：设置应用的基础路径前缀。所有页面、API和静态资源路径都将添加此前缀。

**影响**：

- 所有页面URL将以 `/demand-record` 开头
- 所有API请求路径需要添加此前缀
- 静态资源引用路径会自动添加此前缀

**注意事项**：

- 组件内的API请求需要考虑此配置
- 客户端导航链接应使用相对路径或通过 `Link` 组件自动处理
- 直接硬编码的URL需要手动添加此前缀

### devIndicators

```javascript
devIndicators: false
```

**作用**：禁用开发模式下的指示器（如构建和热重载指示器）。

**影响**：

- 开发环境中不会显示右下角的构建指示器
- 界面更简洁，不会有开发模式特有的UI元素干扰

## 完整配置文件

项目当前使用的完整 `next.config.mjs` 文件内容如下：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  basePath: '/demand-record',
}

export default nextConfig
```

这是一个精简的配置，专注于系统最关键的需求。

## 环境变量与配置覆盖

可以通过环境变量覆盖部分配置，特别是 `basePath`：

```bash
# 覆盖basePath的环境变量
NEXT_PUBLIC_BASE_PATH=/custom-path
```

组件应该检查此环境变量并相应调整API请求路径：

```javascript
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record';
```

## 不同环境的配置注意事项

### 开发环境

- 通常使用默认配置
- 可使用环境变量临时覆盖特定配置
- `devIndicators: false` 会隐藏开发模式的指示器

### 生产环境

- 确保 `basePath`与实际部署路径一致
- 考虑根据部署环境调整 `basePath` 配置

## API请求路径处理最佳实践

为确保API请求正确处理 `basePath`，建议在项目中创建一个统一的API请求工具：

```typescript
// utils/api.ts
export const getApiUrl = (endpoint: string) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/demand-record';
  return `${basePath}/api/${endpoint}`;
};

// 使用示例
import { getApiUrl } from '@/utils/api';

const fetchData = async () => {
  const response = await fetch(getApiUrl('load-data?yearMonth=2023-12'));
  return response.json();
};
```

## 配置变更注意事项

修改Next.js配置时应注意：

1. 更改 `basePath`会影响所有现有部署和URL结构
2. 请同时更新所有组件中使用的路径引用
3. 测试所有页面导航和API请求以确保正常工作
4. 更新部署文档以反映新的配置要求

## 相关文档

- [Next.js官方配置文档](https://nextjs.org/docs/app/api-reference/next-config-js)
- [basePath文档](https://nextjs.org/docs/app/api-reference/next-config-js/basePath)
- [devIndicators文档](https://nextjs.org/docs/app/api-reference/next-config-js/devIndicators)
