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
} 