export interface DemandRecord {
  id: string;         // 唯一标识
  demandId: string;   // 需求ID（可编辑）
  description: string; // 需求描述（可编辑）
  createdAt: Date;    // 创建时间（自动生成，不可编辑）
}

export interface DemandRecordsData {
  lastUpdated: string; // 最后更新时间
  records: DemandRecord[]; // 需求记录数组
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
} 