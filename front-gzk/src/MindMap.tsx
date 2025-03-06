import React, { useCallback, memo, useMemo, createContext } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  useReactFlow,
  NodeTypes,
  Position,
  MarkerType,
  Background,
  BackgroundVariant,
  Controls,
  NodeProps,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import MindMapNode from './MindMapNode';
import axios from 'axios';  // 需要安装 axios
// 导入JSON转换函数
import { convertNGPTToMindMap, convertAnyJSONToMindMap, convertNGPTTreeToMindMap } from './utils/jsonConverters';

// 更新节点类型定义
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

// 定义思维导图节点的默认样式
const nodeDefaults = {
  style: {
    background: '#fff',
    color: '#333',
    fontSize: '13px',
    width: 250,
  },
};

// 修改初始节点数据，给根节点一个固定的初始位置
const initialNodes: Node<CustomNodeData>[] = [
  {
    id: 'root',
    data: { 
      label: '中心主题',
      isCollapsed: false,
      notes: '',
      isNotesCollapsed: true
    },
    position: { x: 250, y: 200 },  // 给一个固定的初始位置
    type: 'mindmap',
    ...nodeDefaults,
  },
];

const initialEdges: Edge[] = [];

// Dagre 图布局配置
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node<CustomNodeData>[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  
  // 重置 dagre 图
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // 设置 dagre 图布局方向和间距
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 150,  // 节点间的垂直间距
    ranksep: 200,  // 层级间的水平间距
    edgesep: 80,   // 边的间距
    marginx: 50,   // 水平边距
    marginy: 50,   // 垂直边距
  });

  // 保存根节点的位置
  const rootNode = nodes.find(n => n.id === 'root');
  const rootPosition = rootNode?.position || { x: 250, y: 200 };

  // 确保所有节点都有有效的位置
  nodes = nodes.map(node => {
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return {
        ...node,
        position: { x: 0, y: 0 }
      };
    }
    return node;
  });

  // 将节点添加到 dagre 图中
  nodes.forEach((node) => {
    // 为每个节点设置宽度和高度
    // 根据节点内容估算大小，这里使用固定值作为示例
    const nodeWidth = 200;  // 默认宽度
    const nodeHeight = 50;  // 默认高度
    
    // 如果节点有笔记且笔记未折叠，增加高度
    if (node.data.notes && !node.data.isNotesCollapsed) {
      // 根据笔记长度估算额外高度
      const extraHeight = Math.min(200, node.data.notes.length / 2);
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight + extraHeight });
    } else {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  // 将边添加到 dagre 图中
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 使用 dagre 计算布局
  dagre.layout(dagreGraph);

  // 应用计算出的位置，但保持根节点位置不变
  return {
    nodes: nodes.map((node) => {
      if (node.id === 'root') {
        return {
          ...node,
          position: rootPosition,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        } as Node<CustomNodeData>;
      }

      // 获取 dagre 计算的节点位置
      const nodeWithPosition = dagreGraph.node(node.id);
      
      // 如果 dagre 没有为该节点计算位置（可能是孤立节点），使用默认位置
      if (!nodeWithPosition) {
        return {
          ...node,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          position: { x: rootPosition.x + 200, y: rootPosition.y },
        } as Node<CustomNodeData>;
      }

      // 使用 dagre 计算的位置
      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: {
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        },
      } as Node<CustomNodeData>;
    }),
    edges,
  };
};

const defaultEdgeOptions = {
  style: {
    strokeWidth: 1.5,
    stroke: '#d9d9d9',
  },
  type: 'bezier',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: '#d9d9d9',
  },
  animated: false,
};

// 创建一个Context来传递节点操作函数
export const NodeOperationsContext = createContext<{
  addChildNode?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  increaseFontSize?: (nodeId: string) => void;
  decreaseFontSize?: (nodeId: string) => void;
}>({});

export default function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, setCenter, getNode, zoomIn, zoomOut } = useReactFlow();

  // 修改视图更新函数
  const updateViewport = useCallback((nodeId?: string) => {
    setTimeout(() => {
      if (nodeId) {
        // 如果指定了节点，将其居中但保持适当的缩放级别
        const node = getNode(nodeId);
        if (node) {
          // 确保节点有有效的位置
          if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            // 如果节点没有有效的位置，使用默认位置
            fitView({ 
              duration: 800,
              padding: 0.3,
              maxZoom: 1.5,
              minZoom: 0.5
            });
            return;
          }

          // 获取节点的大小信息
          const nodeWidth = (node as any).width || 150;
          const nodeHeight = (node as any).height || 100;
          
          // 计算合适的缩放级别
          const viewportWidth = document.querySelector('.react-flow')?.clientWidth || 1000;
          const viewportHeight = document.querySelector('.react-flow')?.clientHeight || 800;
          
          // 确保节点不会占据太多视口空间
          const scale = Math.min(
            viewportWidth / (nodeWidth * 3),  // 水平方向留出空间
            viewportHeight / (nodeHeight * 3), // 垂直方向留出空间
            1.5 // 最大缩放级别
          );

          // 使用 setCenter 而不是 fitView
          setCenter(
            node.position.x + nodeWidth / 2,
            node.position.y + nodeHeight / 2,
            { 
              zoom: scale,
              duration: 800
            }
          );
        } else {
          // 如果找不到节点，适应所有节点
          fitView({ 
            duration: 800,
            padding: 0.3,
            maxZoom: 1.5,
            minZoom: 0.5
          });
        }
      } else {
        // 如果没有指定节点，适应所有节点但限制最大缩放
        fitView({ 
          duration: 800,
          padding: 0.3,  // 增加边距
          maxZoom: 1.5,  // 限制最大缩放级别
          minZoom: 0.5   // 限制最小缩放级别
        });
      }
    }, 50);
  }, [setCenter, fitView, getNode]);

  // 添加更新节点标签的函数
  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 添加处理笔记更新的函数
  const updateNodeNotes = useCallback(
    (nodeId: string, notes: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                notes,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 添加处理笔记折叠的函数
  const toggleNodeNotes = useCallback(
    (nodeId: string) => {
      // 简单地切换笔记折叠状态
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                isNotesCollapsed: !node.data.isNotesCollapsed,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 使用 useMemo 缓存 nodeTypes
  const nodeTypes = useMemo(
    () => ({
      mindmap: memo((props: NodeProps<CustomNodeData>) => (
        <MindMapNode
          {...props}
          onNodeLabelChange={updateNodeLabel}
          onNodeNotesChange={updateNodeNotes}
          onToggleNotes={toggleNodeNotes}
        />
      )),
    }),
    [updateNodeLabel, updateNodeNotes, toggleNodeNotes]
  );

  // 添加折叠/展开功能
  const toggleNodeCollapse = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const getDescendants = (id: string): string[] => {
        const descendants: string[] = [];
        edges.forEach((edge) => {
          if (edge.source === id) {
            descendants.push(edge.target);
            descendants.push(...getDescendants(edge.target));
          }
        });
        return descendants;
      };

      const descendants = getDescendants(nodeId);
      const isCollapsed = !node.data.isCollapsed;

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, isCollapsed } };
          } else if (descendants.includes(n.id)) {
            return { ...n, hidden: isCollapsed };
          }
          return n;
        })
      );

      updateViewport(nodeId);
    },
    [nodes, edges, setNodes, updateViewport]
  );

  // 添加字体放大缩小功能
  const increaseFontSize = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId || (nodeId === 'all' && node.selected)) {
            const currentSize = node.data.style?.fontSize || 13;
            return {
              ...node,
              data: {
                ...node.data,
                style: {
                  ...node.data.style,
                  fontSize: currentSize + 2,
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const decreaseFontSize = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId || (nodeId === 'all' && node.selected)) {
            const currentSize = node.data.style?.fontSize || 13;
            return {
              ...node,
              data: {
                ...node.data,
                style: {
                  ...node.data.style,
                  fontSize: Math.max(8, currentSize - 2), // 最小字号为8px
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 修改 addChildNode 函数
  const addChildNode = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent || parent.data.isCollapsed) return;

      // 确保父节点有有效的位置
      const parentPosition = parent.position && typeof parent.position.x === 'number' && typeof parent.position.y === 'number'
        ? parent.position
        : { x: 0, y: 0 };

      // 计算新节点的初始位置（在父节点右侧）
      const newPosition = {
        x: parentPosition.x + 200,
        y: parentPosition.y
      };

      const newNodeId = `node_${nodes.length + 1}`;
      const newNode: Node<CustomNodeData> = {
        id: newNodeId,
        type: 'mindmap',
        data: { 
          label: '新主题',
          notes: '',
          isNotesCollapsed: true,
          style: { 
            backgroundColor: nodeDefaults.style.background,
            textColor: nodeDefaults.style.color,
            fontSize: parseInt(nodeDefaults.style.fontSize) || 13
          }
        },
        position: newPosition,
      };
      
      const newEdge: Edge = {
        id: `edge_${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
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
        },
      };

      // 先添加新节点和边
      const updatedNodes = [...nodes, newNode];
      const updatedEdges = [...edges, newEdge];
      
      // 立即重新计算布局
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        updatedNodes,
        updatedEdges
      );
      
      // 更新状态
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // 更新视图，聚焦到新节点
      setTimeout(() => {
        updateViewport(newNodeId);
      }, 50);
    },
    [nodes, edges, setNodes, setEdges, updateViewport]
  );

  // 修改 onDeleteNode 函数
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      // 不允许删除根节点
      if (nodeId === 'root') return;

      const getDescendants = (id: string): string[] => {
        const descendants: string[] = [id];
        edges.forEach((edge) => {
          if (edge.source === id) {
            descendants.push(...getDescendants(edge.target));
          }
        });
        return descendants;
      };

      const nodesToDelete = getDescendants(nodeId);
      
      const newEdges = edges.filter(
        (edge) => !nodesToDelete.includes(edge.source) && !nodesToDelete.includes(edge.target)
      );
      
      const newNodes = nodes.filter((node) => !nodesToDelete.includes(node.id));
      
      // 立即重新计算布局
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges
      );
      
      // 更新状态
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // 更新视图以适应所有节点
      setTimeout(() => {
        updateViewport();
      }, 50);
    },
    [nodes, edges, setNodes, setEdges, updateViewport]
  );

  // 更新节点样式功能
  const updateNodeStyle = useCallback(
    (nodeId: string, style: Partial<CustomNodeData['style']>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                style: {
                  ...node.data.style,
                  ...style,
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 修改导出 JSON 的函数，确保包含笔记信息
  const exportToJson = useCallback(() => {
    const exportData = {
      nodes: nodes.map(({ id, data, position }) => ({
        id,
        data: {
          label: data.label,
          notes: data.notes,
          isNotesCollapsed: data.isNotesCollapsed,
          style: data.style,
        },
        position,
      })),
      edges: edges
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mindmap-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  // 修改导入 JSON 的函数
  const importFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    
    if (file) {
      fileReader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // 检查是否是nGPT_tree_r1.json格式
          const isNGPTFormat = (data: any): boolean => {
            const firstValue = Object.values(data)[0];
            return firstValue ? firstValue.hasOwnProperty('Previous') : false;
          };
          
          let processedData;
          
          if (isNGPTFormat(importedData)) {
            // 使用专门的nGPT树形格式转换函数
            processedData = convertNGPTTreeToMindMap(importedData);
          } else if (importedData.nodes && importedData.edges) {
            // 标准思维导图格式
            // 确保导入的节点具有正确的类型和默认样式
            const processedNodes = importedData.nodes.map((node: Node<CustomNodeData>) => {
              // 确保节点有有效的位置
              const position = node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number'
                ? node.position
                : { x: 0, y: 0 };
                
              return {
                ...node,
                type: 'mindmap',  // 设置正确的节点类型
                position,
                data: {
                  ...node.data,
                  style: {
                    backgroundColor: node.data.style?.backgroundColor || nodeDefaults.style.background,
                    textColor: node.data.style?.textColor || nodeDefaults.style.color,
                    fontSize: node.data.style?.fontSize || parseInt(nodeDefaults.style.fontSize) || 13
                  }
                }
              };
            });

            // 使用处理后的节点重新计算布局
            processedData = getLayoutedElements(
              processedNodes,
              importedData.edges
            );
          } else {
            // 尝试转换其他格式的JSON
            processedData = convertAnyJSONToMindMap(importedData);
          }
          
          // 确保处理后的数据有有效的节点和边
          if (processedData.nodes && processedData.nodes.length > 0) {
            setNodes(processedData.nodes);
            setEdges(processedData.edges || []);
            
            setTimeout(() => {
              fitView({ duration: 800, padding: 0.2 });
            }, 50);
          } else {
            throw new Error('导入的数据没有有效的节点');
          }
        } catch (error) {
          console.error('Error importing JSON:', error);
          alert('导入失败：无效的 JSON 文件');
        }
      };
      fileReader.readAsText(file);
    }
    
    // 清空文件输入，以便可以重新选择同一个文件
    event.target.value = '';
  }, [setNodes, setEdges, fitView]);

  // 添加上传 PDF 的处理函数
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // 确保使用正确的后端地址和端口
      const response = await axios.post('http://localhost:3001/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        console.log('PDF uploaded successfully:', response.data);
        alert('PDF上传成功！');
        
        // 获取上传后的文件URL
        const pdfUrl = `http://localhost:3001${response.data.file.url}`;
        console.log('PDF URL:', pdfUrl);
        
        // TODO: 更新 iframe 显示上传的 PDF
        // document.querySelector('iframe')?.setAttribute('src', pdfUrl);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      if (axios.isAxiosError(error)) {
        alert(`上传PDF失败：${error.response?.data?.message || '请检查服务器连接'}`);
      } else {
        alert('上传PDF失败，请重试');
      }
    }
  };

  // 创建一个包含所有节点操作的对象
  const nodeOperations = useMemo(() => ({
    addChildNode,
    onDeleteNode,
    increaseFontSize,
    decreaseFontSize
  }), [addChildNode, onDeleteNode, increaseFontSize, decreaseFontSize]);

  return (
    // 最外层容器，占满整个视口并使用 flex 布局
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* 左侧论文查看器部分 */}
      <div style={{ 
        width: '45%',          // 占据左侧45%宽度
        height: '100vh',       // 占满视口高度
        marginLeft: '0px',    // 左侧留白
        border: 'none', // 添加边框
        position: 'absolute',  // 绝对定位
        left: 0,              // 靠左对齐
        top: '50%',           // 垂直居中
        transform: 'translateY(-50%)' // 精确垂直居中
      }}>
        {/* 添加 PDF 上传按钮 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => document.getElementById('pdfFileInput')?.click()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            上传论文PDF
          </button>
          <input
            id="pdfFileInput"
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* 嵌入 paper-viewer 的 iframe */}
        <iframe 
          title="论文查看器"
          src="/paper-viewer/paper-viewer.html"
          style={{
            width: '100%',     // 填满父容器
            height: '100%',    // 填满父容器
            border: 'none'     // 移除 iframe 边框
          }}
        />
      </div>

      {/* 右侧思维导图部分 */}
      <div style={{ 
        width: '55%',          // 占据右侧52%宽度
        height: '100vh',        // 占据90%视口高度
        marginLeft: 'auto',    // 自动左边距实现靠右
        marginRight: '0px',   // 右侧留白
        border: '1px solid #ddd', // 添加边框
        position: 'absolute',  // 绝对定位
        right: 0,             // 靠右对齐
        top: '50%',           // 垂直居中
        transform: 'translateY(-50%)' // 精确垂直居中
      }}>
        <NodeOperationsContext.Provider value={nodeOperations}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.Bezier}
            connectionLineStyle={{ 
              stroke: '#d9d9d9', 
              strokeWidth: 1.5 
            }}
            fitView
            fitViewOptions={{ 
              padding: 0.3,
              maxZoom: 1.5,
              minZoom: 0.5
            }}
            minZoom={0.5}     // 调整最小缩放级别
            maxZoom={1.5}     // 调整最大缩放级别
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={true}
            panOnDrag={true}
            preventScrolling={false}
            nodesDraggable={true}
            nodesConnectable={true}
            noDragClassName="nodrag"
            attributionPosition="bottom-left"
          >
            <Background 
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
            />
            <Controls />
            <Panel position="top-right">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length === 1) {
                      addChildNode(selectedNodes[0].id);
                    } else {
                      addChildNode('root');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  添加子主题
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length === 1 && selectedNodes[0].id !== 'root') {
                      onDeleteNode(selectedNodes[0].id);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  删除节点
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length === 1) {
                      toggleNodeCollapse(selectedNodes[0].id);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  折叠/展开
                </button>
                <button
                  onClick={() => {
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                      nodes,
                      edges
                    );
                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                    setTimeout(() => {
                      fitView({ duration: 800, padding: 0.2 });
                    }, 50);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  重新布局
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length > 0) {
                      const colors = ['#ffeb3b', '#4caf50', '#2196f3', '#f44336', '#9c27b0'];
                      const currentColor = selectedNodes[0].data.style?.backgroundColor;
                      const currentIndex = colors.indexOf(currentColor || '');
                      const nextColor = colors[(currentIndex + 1) % colors.length];
                      updateNodeStyle(selectedNodes[0].id, { backgroundColor: nextColor });
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  更改颜色
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length > 0) {
                      const currentSize = Number(selectedNodes[0].data.style?.fontSize || 14);
                      updateNodeStyle(selectedNodes[0].id, { fontSize: currentSize + 2 });
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  增大字号
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length > 0) {
                      const currentSize = Number(selectedNodes[0].data.style?.fontSize || 14);
                      updateNodeStyle(selectedNodes[0].id, { fontSize: Math.max(8, currentSize - 2) });
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  减小字号
                </button>
              </div>
            </Panel>
            <Panel position="bottom-left">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={exportToJson}
                  style={{
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  导出JSON
                </button>
                <button
                  onClick={() => {
                    // 触发隐藏的文件输入框
                    document.getElementById('jsonFileInput')?.click();
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  导入JSON
                </button>
                <input
                  id="jsonFileInput"
                  type="file"
                  accept=".json"
                  onChange={importFromJson}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => {
                    // 触发隐藏的文件输入框，专门用于导入nGPT格式
                    document.getElementById('ngptFileInput')?.click();
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  导入nGPT格式
                </button>
                <input
                  id="ngptFileInput"
                  type="file"
                  accept=".json"
                  onChange={importFromJson}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => zoomIn()}
                  style={{
                    padding: '8px 12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  放大画布
                </button>
                <button
                  onClick={() => zoomOut()}
                  style={{
                    padding: '8px 12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  缩小画布
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length > 0) {
                      increaseFontSize(selectedNodes[0].id);
                    } else {
                      increaseFontSize('all');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  放大字体
                </button>
                <button
                  onClick={() => {
                    const selectedNodes = nodes.filter((node) => node.selected);
                    if (selectedNodes.length > 0) {
                      decreaseFontSize(selectedNodes[0].id);
                    } else {
                      decreaseFontSize('all');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  缩小字体
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </NodeOperationsContext.Provider>
      </div>
    </div>
  );
} 