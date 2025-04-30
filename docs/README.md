# 需求记录系统文档

欢迎使用需求记录系统文档。本文档集包含了系统的各个方面，从入门指南到技术细节，帮助您快速上手并深入了解系统实现。

## 文档结构

文档按照以下类别组织：

### 📚 指南

- [入门指南](./guides/getting-started.md) - 系统概述、安装步骤和基本使用
- [常见问题](./guides/getting-started.md#常见问题) - 常见问题解答
- [故障排除指南](./guides/troubleshooting.md) - 常见错误及解决方案

### 💻 客户端

- [组件](./client/components/) - 前端UI组件文档
  - [DemandRecordTable](./client/components/DemandRecordTable.md) - 需求记录表格组件
- [Next.js 配置](./client/next-config.md) - Next.js 配置说明及对客户端的影响

### 🖥️ 服务端

- [API文档](./server/api/demand-records.md) - API端点、请求和响应格式
- [实现细节](./server/implementation.md) - 服务端代码实现和架构

### 🗄️ 数据库

- [数据库模式](./database/sqlite-schema.md) - 数据库表结构、字段和索引

## 快速入门

如果您是第一次使用需求记录系统，建议按照以下顺序阅读文档：

1. [入门指南](./guides/getting-started.md) - 了解系统概述和基本使用
2. [需求记录表格组件](./client/components/DemandRecordTable.md) - 了解主要界面组件
3. [API文档](./server/api/demand-records.md) - 了解系统API
4. [数据库模式](./database/sqlite-schema.md) - 了解数据存储方式
5. [Next.js 配置](./client/next-config.md) - 了解系统配置

如果在项目开发或部署过程中遇到问题，请参考[故障排除指南](./guides/troubleshooting.md)。

## 贡献文档

### 文档规范

1. 使用Markdown格式编写所有文档
2. 保持文档结构一致，使用清晰的标题层级
3. 代码示例使用适当的语法高亮
4. 文档应当简洁明了，避免冗余内容
5. 更新代码时同步更新相关文档

### 添加新文档

1. 根据内容类型，将文档放在适当的目录中
2. 在主README中添加链接
3. 确保文档遵循现有的格式和风格

## 文档目录结构

```
docs/
├── README.md                         # 本文件，文档总索引
├── client/                           # 客户端相关文档
│   ├── components/                   # 客户端组件文档
│   │   └── DemandRecordTable.md      # 需求记录表格组件文档
│   └── next-config.md                # Next.js配置文档
├── server/                           # 服务端相关文档
│   ├── api/                          # API文档
│   │   └── demand-records.md         # 需求记录API文档
│   └── implementation.md             # 服务端实现细节
├── database/                         # 数据库相关文档
│   └── sqlite-schema.md              # SQLite数据库模式文档
└── guides/                           # 使用指南
    ├── getting-started.md            # 入门指南
    └── troubleshooting.md            # 故障排除指南
```

## 更新日志

### 2024年4月更新

#### 新功能

1. **CSV导出增强**：
   - 修改导出逻辑，当没有选择任何行时，导出所有年月的需求记录数据
   - 优化按钮提示，显示"导出CSV (全部)"，更明确功能
   - 添加导出中状态反馈，防止重复操作

2. **新增API端点**：
   - 添加 `/api/all-demands` 接口，用于获取数据库中所有年月的需求记录
   - 新接口主要用于支持全量数据导出功能

#### 文档更新

- 更新了组件文档，详细说明了CSV导出功能的新逻辑
- 增加了新API端点的完整文档
- 更新了服务端实现文档，添加了新增函数的说明 