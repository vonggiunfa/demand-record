// 定义需求记录数据结构
export interface DemandRecord {
  id: string;
  description: string;
  createdAt: Date;
  select?: boolean;
}

// 定义表格列配置
export interface ColumnType {
  title: string;
  dataIndex: string;
  key: string;
  isReadOnly: boolean;
  width?: string;
  minWidth?: string;
  highlight?: boolean;
} 