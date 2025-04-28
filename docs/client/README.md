# 客户端文档

本目录包含需求记录系统客户端部分的所有文档，包括UI组件、配置和最佳实践。

## 内容索引

### 组件文档

- [组件概览](./components/README.md) - 客户端组件总览和设计原则
- [DemandRecordTable](./components/DemandRecordTable.md) - 需求记录表格组件

### 配置文档

- [Next.js 配置](./next-config.md) - Next.js 配置说明及对客户端的影响

## 快速链接

- [服务端 API 文档](../server/api/demand-records.md)
- [数据库模式](../database/sqlite-schema.md)
- [入门指南](../guides/getting-started.md)

## 设计原则

客户端实现遵循以下设计原则：

1. **组件化设计**：将UI拆分为可复用的组件
2. **响应式布局**：适配各种屏幕尺寸
3. **性能优化**：使用React.memo、useCallback等优化渲染性能
4. **API封装**：统一处理API请求，包括路径前缀和错误处理
5. **一致的用户体验**：保持统一的交互模式和视觉风格

## 开发规范

1. **TypeScript**：使用TypeScript确保类型安全
2. **命名规范**：
   - 组件使用PascalCase命名
   - 函数使用camelCase命名
   - 常量使用UPPER_SNAKE_CASE命名
3. **样式方案**：使用Tailwind CSS实现样式
4. **状态管理**：小型组件使用useState，复杂组件考虑使用useReducer
5. **API请求**：统一使用fetch API，考虑basePath配置

## 配置简化说明

最近的 Next.js 配置更新遵循了"简化优先"的原则，将配置文件精简为仅包含最基本的配置项：

- `basePath`: 设置应用的基础路径前缀，用于路由和API请求路径
- `devIndicators`: 控制开发环境中的UI指示器显示

这种简化配置有以下好处：
- 降低维护复杂度
- 减少配置错误风险
- 提高构建过程的稳定性
- 使用Next.js提供的默认最佳实践 