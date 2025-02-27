import React, { memo, useState, useCallback, useContext } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeOperationsContext } from './MindMap';

interface CustomNodeData {
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

interface MindMapNodeProps extends NodeProps<CustomNodeData> {
  onNodeLabelChange?: (nodeId: string, label: string) => void;
  onNodeNotesChange?: (nodeId: string, notes: string) => void;
  onToggleNotes?: (nodeId: string) => void;
}

const getNodeStyle = (data: any) => {
  const style: React.CSSProperties = {
    padding: '12px 20px',
    borderRadius: '8px',
    background: data.style?.backgroundColor || '#fff',
    color: data.style?.textColor || '#333',
    fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '13px',
    transition: 'all 250ms ease',
    boxShadow: '0 2px 5px -1px rgba(0,0,0,0.1)',
    width: data.width || 250,
    height: data.height || 'auto',
    textAlign: 'center',
    position: 'relative',
    border: '1px solid #e5e7eb',
  };

  if (data.isCollapsed) {
    style.background = '#f5f5f5';
  }

  return style;
};

const handleStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  background: 'transparent',
  border: 'none',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
};

// 修改样式定义
const nodeContentStyle: React.CSSProperties = {
  cursor: 'text',
  userSelect: 'text',
  WebkitUserSelect: 'text',
  padding: '4px',
  fontSize: '13px',
  lineHeight: '1.4',
};

export default memo(({ 
  data, 
  id, 
  onNodeLabelChange, 
  onNodeNotesChange, 
  onToggleNotes 
}: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localNotes, setLocalNotes] = useState(data.notes || '');
  
  // 使用Context获取节点操作函数
  const { addChildNode, onDeleteNode, increaseFontSize, decreaseFontSize } = useContext(NodeOperationsContext);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    setIsEditing(false);
    if (localLabel !== data.label && onNodeLabelChange) {
      onNodeLabelChange(id, localLabel);
    }
  };

  const handleNotesDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingNotes(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
  };

  const handleNotesBlur = () => {
    setIsEditingNotes(false);
    if (localNotes !== data.notes && onNodeNotesChange) {
      onNodeNotesChange(id, localNotes);
    }
  };

  // 阻止事件冒泡
  const preventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      style={getNodeStyle(data)}
      className="mindmap-node"
    >
      <Handle 
        type="target" 
        position={Position.Left}
        style={handleStyle}
      />

      {/* 节点标签区域 */}
      <div 
        className="nodrag"
        style={nodeContentStyle}
        onClick={preventPropagation}
      >
        {isEditing ? (
          <input
            value={localLabel}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            className="nodrag"
            autoFocus
            style={{ 
              width: '100%',
              border: 'none',
              background: 'transparent',
              textAlign: 'inherit',
              fontSize: 'inherit',
              color: 'inherit',
              outline: 'none',
            }}
            onClick={preventPropagation}
          />
        ) : (
          <div 
            onDoubleClick={handleLabelDoubleClick}
            className="nodrag"
            style={{
              cursor: 'text',
            }}
          >
            {data.label}
          </div>
        )}
      </div>

      {/* 笔记控制区域 */}
      <div 
        className="nodrag" 
        style={{
          marginTop: '5px',
          borderTop: '1px solid #eee',
          paddingTop: '5px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleNotes) {
              onToggleNotes(id);
            }
          }}
          className="nodrag"
          style={{
            background: '#f0f0f0',
            border: '1px solid #ddd',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {data.isNotesCollapsed ? '显示笔记' : '隐藏笔记'}
        </button>
      </div>

      {/* 笔记内容区域 */}
      {!data.isNotesCollapsed && (
        <div 
          className="nodrag"
          style={{
            ...nodeContentStyle,
            marginTop: '5px',
            padding: '5px',
            background: '#f5f5f5',
            borderRadius: '3px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
          onClick={preventPropagation}
        >
          {isEditingNotes ? (
            <textarea
              value={localNotes}
              onChange={handleNotesChange}
              onBlur={handleNotesBlur}
              className="nodrag"
              autoFocus
              style={{
                width: '100%',
                minHeight: '60px',
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                resize: 'vertical',
                outline: 'none',
              }}
              onClick={preventPropagation}
            />
          ) : (
            <div
              onDoubleClick={handleNotesDoubleClick}
              className="nodrag"
              style={{
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                minHeight: '20px',
                cursor: 'text',
              }}
            >
              {data.notes || '双击添加笔记'}
            </div>
          )}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right}
        style={handleStyle}
      />

      {/* 自定义样式 */}
      <style>
        {`
          .mindmap-node * {
            pointer-events: auto;
          }
        `}
      </style>
    </div>
  );
}); 