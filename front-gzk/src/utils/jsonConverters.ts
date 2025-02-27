import { Node, Edge, MarkerType } from 'reactflow';
import { CustomNodeData } from '../types';

// nGPT 格式的数据接口
interface NGPTNode {
  Previous: string | null;
  Question: string;
  Answer: string;
}

interface NGPTData {
  [key: string]: NGPTNode;
}

// 默认节点样式
const defaultStyle = {
  backgroundColor: '#ffffff',
  textColor: '#333333',
  fontSize: 14,
};

/**
 * 将 nGPT 格式的 JSON 转换为思维导图格式
 */
export const convertNGPTToMindMap = (ngptData: NGPTData) => {
  const nodes: Node<CustomNodeData>[] = [];
  const edges: Edge[] = [];

  // 转换所有节点
  Object.entries(ngptData).forEach(([id, data]) => {
    // 创建节点，确保完全符合 MindMap 组件的节点格式
    const node: Node<CustomNodeData> = {
      id,
      type: 'mindmap',
      // 如果是根节点（没有 Previous），给一个固定位置
      position: data.Previous === null ? { x: 250, y: 200 } : { x: 0, y: 0 },
      data: {
        label: data.Question || 'Root',
        notes: data.Answer,
        isNotesCollapsed: true,
        isCollapsed: false,
        style: {
          backgroundColor: defaultStyle.backgroundColor,
          textColor: defaultStyle.textColor,
          fontSize: defaultStyle.fontSize,
        }
      },
      draggable: true,
      selectable: true,
      connectable: true,
    };
    nodes.push(node);

    // 如果有父节点，创建边
    if (data.Previous) {
      const edge: Edge = {
        id: `edge-${data.Previous}-${id}`,
        source: data.Previous,
        target: id,
        type: 'bezier',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#d9d9d9',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#d9d9d9',
        }
      };
      edges.push(edge);
    }
  });

  return { nodes, edges };
};

/**
 * 检查是否是 nGPT 格式的 JSON
 */
export const isNGPTFormat = (data: any): boolean => {
  const firstValue = Object.values(data)[0];
  return firstValue ? firstValue.hasOwnProperty('Previous') : false;
};

/**
 * 计算节点的布局位置
 * 使用改进的树形布局算法，确保节点不会重叠
 */
const calculateNodePositions = (
  nodes: Node<CustomNodeData>[],
  edges: Edge[],
  rootId: string,
  startX: number = 250,
  startY: number = 200,
  horizontalSpacing: number = 300,
  verticalSpacing: number = 150
) => {
  // 构建节点的父子关系图
  const childrenMap: Record<string, string[]> = {};
  const nodeMap: Record<string, Node<CustomNodeData>> = {};
  
  // 初始化
  nodes.forEach(node => {
    nodeMap[node.id] = node;
    childrenMap[node.id] = [];
  });
  
  // 填充子节点信息
  edges.forEach(edge => {
    if (childrenMap[edge.source]) {
      childrenMap[edge.source].push(edge.target);
    }
  });
  
  // 计算每个节点的深度（从根节点开始的层级）
  const depthMap: Record<string, number> = {};
  const calculateDepth = (nodeId: string, depth: number = 0) => {
    depthMap[nodeId] = depth;
    (childrenMap[nodeId] || []).forEach(childId => {
      calculateDepth(childId, depth + 1);
    });
  };
  calculateDepth(rootId);
  
  // 按深度对节点进行分组
  const nodesByDepth: Record<number, string[]> = {};
  Object.entries(depthMap).forEach(([nodeId, depth]) => {
    if (!nodesByDepth[depth]) {
      nodesByDepth[depth] = [];
    }
    nodesByDepth[depth].push(nodeId);
  });
  
  // 计算每个节点的子树大小
  const subtreeSizeMap: Record<string, number> = {};
  const calculateSubtreeSize = (nodeId: string): number => {
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) {
      subtreeSizeMap[nodeId] = 1;
      return 1;
    }
    
    let size = 0;
    children.forEach(childId => {
      size += calculateSubtreeSize(childId);
    });
    
    subtreeSizeMap[nodeId] = size;
    return size;
  };
  calculateSubtreeSize(rootId);
  
  // 设置节点位置
  const maxDepth = Math.max(...Object.values(depthMap));
  const yOffsetMap: Record<number, number> = {}; // 每层的Y偏移
  
  // 从根节点开始设置位置
  const setPositions = (nodeId: string, x: number, y: number) => {
    const node = nodeMap[nodeId];
    if (!node) return;
    
    // 设置当前节点位置
    node.position = { x, y };
    
    const depth = depthMap[nodeId];
    const children = childrenMap[nodeId] || [];
    
    if (children.length === 0) return;
    
    // 计算子节点位置
    let childY = y - (subtreeSizeMap[nodeId] - 1) * verticalSpacing / 2;
    if (yOffsetMap[depth + 1] === undefined) {
      yOffsetMap[depth + 1] = childY;
    } else {
      childY = Math.max(childY, yOffsetMap[depth + 1]);
    }
    
    children.forEach(childId => {
      const childSize = subtreeSizeMap[childId];
      const childCenterY = childY + (childSize - 1) * verticalSpacing / 2;
      setPositions(childId, x + horizontalSpacing, childCenterY);
      childY += childSize * verticalSpacing;
      yOffsetMap[depth + 1] = childY;
    });
  };
  
  setPositions(rootId, startX, startY);
  
  return nodes;
};

/**
 * 将任意格式的JSON转换为nGPT格式，然后再转换为思维导图格式
 * 支持不同版本的JSON格式，确保节点位置不会混乱
 */
export const convertAnyJSONToMindMap = (jsonData: any) => {
  // 如果已经是nGPT格式，直接使用现有函数
  if (isNGPTFormat(jsonData)) {
    const { nodes, edges } = convertNGPTToMindMap(jsonData);
    
    // 找到根节点
    const rootNode = nodes.find(node => {
      const nodeData = jsonData[node.id];
      return nodeData.Previous === null;
    });
    
    if (rootNode) {
      // 计算并更新节点位置
      const positionedNodes = calculateNodePositions(nodes, edges, rootNode.id);
      return { nodes: positionedNodes, edges };
    }
    
    return { nodes, edges };
  }
  
  // 如果是其他格式，先转换为nGPT格式
  const convertedData: NGPTData = {};
  
  // 尝试识别并转换不同的格式
  // 这里假设JSON有一个根节点和多个子节点的结构
  try {
    // 创建根节点
    convertedData["Root"] = {
      Previous: null,
      Question: "根节点",
      Answer: ""
    };
    
    // 处理其他节点
    // 这里需要根据实际的JSON格式进行调整
    Object.entries(jsonData).forEach(([key, value]: [string, any], index) => {
      if (key === "Root") return; // 跳过根节点
      
      // 为每个节点创建一个唯一ID
      const nodeId = `Node_${index}`;
      
      // 提取问题和答案
      // 这里需要根据实际的JSON格式进行调整
      const question = value.title || value.question || key;
      const answer = value.content || value.answer || JSON.stringify(value);
      
      // 添加到转换后的数据中
      convertedData[nodeId] = {
        Previous: "Root", // 默认所有节点都连接到根节点
        Question: question,
        Answer: answer
      };
    });
    
    // 转换为思维导图格式
    const { nodes, edges } = convertNGPTToMindMap(convertedData);
    
    // 计算并更新节点位置
    const positionedNodes = calculateNodePositions(nodes, edges, "Root");
    
    return { nodes: positionedNodes, edges };
  } catch (error) {
    console.error("转换JSON格式失败:", error);
    return { nodes: [], edges: [] };
  }
};

/**
 * 将特定格式的树形JSON转换为思维导图格式
 * 适用于nGPT_tree_r1.json这样的格式
 */
export const convertTreeJSONToMindMap = (jsonData: any) => {
  // 检查是否已经是nGPT格式
  if (isNGPTFormat(jsonData)) {
    // 这里我们直接使用jsonData，因为它已经是nGPT格式
    const { nodes, edges } = convertNGPTToMindMap(jsonData);
    
    // 找到根节点
    const rootNode = nodes.find(node => {
      const nodeData = jsonData[node.id];
      return nodeData.Previous === null;
    });
    
    if (rootNode) {
      // 计算并更新节点位置
      const positionedNodes = calculateNodePositions(nodes, edges, rootNode.id);
      return { nodes: positionedNodes, edges };
    }
    
    return { nodes, edges };
  }
  
  // 如果不是nGPT格式，尝试转换
  try {
    // 创建一个新的nGPT格式数据
    const convertedData: NGPTData = {};
    
    // 遍历JSON中的所有节点
    Object.entries(jsonData).forEach(([nodeId, nodeData]: [string, any]) => {
      // 检查节点是否有必要的字段
      if (nodeData && typeof nodeData === 'object') {
        // 提取Previous、Question和Answer字段
        const previous = nodeData.Previous;
        const question = nodeData.Question || '';
        const answer = nodeData.Answer || '';
        
        // 添加到转换后的数据中
        convertedData[nodeId] = {
          Previous: previous,
          Question: question,
          Answer: answer
        };
      }
    });
    
    // 转换为思维导图格式
    const { nodes, edges } = convertNGPTToMindMap(convertedData);
    
    // 找到根节点
    const rootNode = nodes.find(node => {
      const nodeData = convertedData[node.id];
      return nodeData.Previous === null;
    });
    
    if (rootNode) {
      // 计算并更新节点位置
      const positionedNodes = calculateNodePositions(nodes, edges, rootNode.id);
      return { nodes: positionedNodes, edges };
    }
    
    return { nodes, edges };
  } catch (error) {
    console.error("转换树形JSON格式失败:", error);
    return { nodes: [], edges: [] };
  }
};

/**
 * 专门处理nGPT_tree_r1.json格式的函数
 * 这种格式已经是nGPT格式，但可能需要特殊处理
 */
export const convertNGPTTreeToMindMap = (jsonData: any) => {
  // 验证是否是正确的格式
  if (!isNGPTFormat(jsonData)) {
    console.error("不是有效的nGPT树形格式");
    return { nodes: [], edges: [] };
  }
  
  try {
    // 直接使用现有的转换函数
    const { nodes, edges } = convertNGPTToMindMap(jsonData);
    
    // 找到根节点
    const rootNode = nodes.find(node => {
      const nodeData = jsonData[node.id];
      return nodeData.Previous === null;
    });
    
    if (!rootNode) {
      console.error("找不到根节点");
      return { nodes, edges };
    }
    
    // 计算并更新节点位置
    const positionedNodes = calculateNodePositions(
      nodes, 
      edges, 
      rootNode.id,
      250,  // 起始X坐标
      200,  // 起始Y坐标
      350,  // 水平间距
      180   // 垂直间距
    );
    
    // 为节点添加不同的样式
    positionedNodes.forEach(node => {
      // 根节点使用特殊样式
      if (node.id === rootNode.id) {
        node.data.style = {
          ...node.data.style,
          backgroundColor: '#f0f9ff',
          textColor: '#0369a1',
          fontSize: 16
        };
      } else {
        // 根据节点深度设置不同的颜色
        const nodeData = jsonData[node.id];
        const parentId = nodeData.Previous;
        
        if (parentId === rootNode.id) {
          // 第一层节点
          node.data.style = {
            ...node.data.style,
            backgroundColor: '#f0fdf4',
            textColor: '#166534',
            fontSize: 14
          };
        } else {
          // 更深层次的节点
          node.data.style = {
            ...node.data.style,
            backgroundColor: '#fff',
            textColor: '#333',
            fontSize: 14
          };
        }
      }
    });
    
    return { nodes: positionedNodes, edges };
  } catch (error) {
    console.error("处理nGPT树形格式失败:", error);
    return { nodes: [], edges: [] };
  }
}; 