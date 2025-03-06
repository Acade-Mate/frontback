export interface CustomNodeData {
  label: string;
  isCollapsed?: boolean;
  notes?: string;
  isNotesCollapsed?: boolean;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  };
  height?: number;
  width?: number; // 添加 width 属性
} 