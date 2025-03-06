import React, { memo, useState, useCallback } from 'react'; // 导入React和相关钩子
import { Handle, Position } from 'reactflow'; // 导入React Flow的Handle和Position
import { CustomNodeData } from '../types'; // 导入自定义节点数据类型

// 定义思维导图节点的属性
interface MindMapNodeProps {
  id: string; // 添加 id 属性
  data: CustomNodeData; // 节点数据
  selected: boolean; // 是否被选中
  onNodeLabelChange?: (nodeId: string, label: string) => void; // 节点标签变化回调
  onNodeNotesChange?: (nodeId: string, notes: string) => void; // 节点笔记变化回调
  onToggleNotes?: (nodeId: string) => void; // 切换笔记折叠状态回调
}

// 获取节点样式
const getNodeStyle = (data: CustomNodeData, selected: boolean) => {
  const style: React.CSSProperties = {
    padding: '12px 20px', // 内边距
    borderRadius: '8px', // 圆角
    background: data.style?.backgroundColor || '#fff', // 背景颜色
    color: data.style?.textColor || '#333', // 文字颜色
    fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '13px', // 字体大小
    transition: 'all 250ms ease', // 动画过渡效果
    width: data.width || 250, // 宽度
    height: data.height || 'auto', // 高度
    textAlign: 'center', // 文字居中
    position: 'relative', // 相对定位
    border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb', // 边框样式
    boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 2px 5px -1px rgba(0,0,0,0.1)' // 阴影效果
  };

  if (data.isCollapsed) {
    style.background = '#f5f5f5'; // 折叠状态下的背景颜色
  }

  return style; // 返回样式对象
};

// 定义思维导图节点组件
const MindMapNode = memo((props: MindMapNodeProps) => {
  const { data, selected, onNodeLabelChange, onNodeNotesChange, onToggleNotes } = props; // 解构属性

  const [isEditingLabel, setIsEditingLabel] = useState(false); // 编辑标签状态
  const [localLabel, setLocalLabel] = useState(data.label); // 本地标签状态

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLabel(e.target.value); // 更新本地标签
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false); // 失去焦点时停止编辑
    if (onNodeLabelChange) {
      onNodeLabelChange(props.id, localLabel); // 调用标签变化回调
    }
  };

  const handleNotesDoubleClick = () => {
    if (onToggleNotes) {
      onToggleNotes(props.id); // 切换笔记折叠状态
    }
  };

  return (
    <div style={getNodeStyle(data, selected)}> // 应用节点样式
      {isEditingLabel ? ( // 如果处于编辑状态
        <input
          value={localLabel} // 输入框的值为本地标签
          onChange={handleLabelChange} // 处理输入变化
          onBlur={handleLabelBlur} // 失去焦点时处理
          autoFocus // 自动聚焦
        />
      ) : (
        <div onDoubleClick={() => setIsEditingLabel(true)}> // 双击进入编辑状态
          {data.label} // 显示标签
        </div>
      )}
      <Handle 
        type="source" // 源手柄
        position={Position.Right} // 位置在右侧
        style={{ width: 24, height: 24, background: 'transparent', border: 'none', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} // 手柄样式
      />
      {/* 其他内容 */}
    </div>
  );
});

export default MindMapNode; // 导出思维导图节点组件 