# DemandRecordTable 组件使用示例

本文档提供了 DemandRecordTable 组件的使用示例和常见场景。

## 基本用法

在页面中引入并使用 DemandRecordTable 组件：

```tsx
import DemandRecordTable from '@/components/DemandRecordTable';

export default function DemandPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">项目需求记录</h1>
      <DemandRecordTable />
    </div>
  );
}
```

## 常见使用场景

### 1. 产品需求记录

适用于产品团队记录和跟踪产品功能需求，可以导出CSV与其他团队共享。

```tsx
<div className="space-y-4">
  <h2 className="text-xl font-semibold">产品需求记录</h2>
  <p className="text-gray-500">请记录产品功能需求，并通过导出功能与开发团队共享</p>
  <DemandRecordTable />
</div>
```

### 2. 项目任务管理

适用于项目管理，记录项目中的各项任务和需求。

```tsx
<div className="card">
  <div className="card-header">
    <h3>项目任务清单</h3>
  </div>
  <div className="card-body">
    <DemandRecordTable />
  </div>
  <div className="card-footer">
    <p className="text-sm text-gray-500">注意：记得定期导出备份数据</p>
  </div>
</div>
```

## 使用技巧

1. **批量操作**：先通过表头的复选框全选，再进行编辑或删除操作
2. **快速输入**：使用Tab和Enter键可以在各输入框之间快速切换
3. **数据备份**：定期使用导出功能将数据保存为CSV文件，避免数据丢失
4. **自动时间**：创建时间会自动设置为当前时间，无需手动输入

## 注意事项

1. 页面刷新后数据会丢失，请务必使用导出功能保存重要数据
2. 导入CSV时会验证文件格式，确保使用本组件导出的CSV格式
3. 选中行后才能编辑需求ID和描述，未选中的行只能查看
4. 创建时间在记录创建时自动生成，不支持手动修改
5. 导入大量数据可能会影响页面性能，建议分批导入 