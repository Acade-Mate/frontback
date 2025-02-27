// 模拟算法服务响应
export const mockGenerateKnowledgeTree = (fileId: string) => {
  console.log('📊 生成模拟知识树, fileId:', fileId);
  
  // 这是一个模拟的知识树结构，格式与前端MindMap组件兼容
  const tree = {
    nodes: [
      {
        id: 'root',
        data: { 
          label: '论文主题',
          notes: '这是论文的主要内容概述',
          isNotesCollapsed: true,
          isCollapsed: false,
          style: {
            backgroundColor: '#f0f9ff',
            textColor: '#0369a1',
            fontSize: 16
          }
        },
        position: { x: 250, y: 200 },
        type: 'mindmap',
      },
      {
        id: 'node_1',
        data: { 
          label: '研究背景',
          notes: '该领域的研究背景和相关工作',
          isNotesCollapsed: true,
          isCollapsed: false,
          style: {
            backgroundColor: '#f0fdf4',
            textColor: '#166534',
            fontSize: 14
          }
        },
        position: { x: 450, y: 100 },
        type: 'mindmap',
      },
      {
        id: 'node_2',
        data: { 
          label: '研究方法',
          notes: '本文采用的研究方法和技术路线',
          isNotesCollapsed: true,
          isCollapsed: false,
          style: {
            backgroundColor: '#f0fdf4',
            textColor: '#166534',
            fontSize: 14
          }
        },
        position: { x: 450, y: 200 },
        type: 'mindmap',
      },
      {
        id: 'node_3',
        data: { 
          label: '实验结果',
          notes: '本研究的主要实验结果和发现',
          isNotesCollapsed: true,
          isCollapsed: false,
          style: {
            backgroundColor: '#f0fdf4',
            textColor: '#166534',
            fontSize: 14
          }
        },
        position: { x: 450, y: 300 },
        type: 'mindmap',
      }
    ],
    edges: [
      {
        id: 'edge-root-node_1',
        source: 'root',
        target: 'node_1',
        type: 'bezier',
        markerEnd: {
          type: 'arrowclosed',
          width: 15,
          height: 15,
          color: '#d9d9d9',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#d9d9d9',
        }
      },
      {
        id: 'edge-root-node_2',
        source: 'root',
        target: 'node_2',
        type: 'bezier',
        markerEnd: {
          type: 'arrowclosed',
          width: 15,
          height: 15,
          color: '#d9d9d9',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#d9d9d9',
        }
      },
      {
        id: 'edge-root-node_3',
        source: 'root',
        target: 'node_3',
        type: 'bezier',
        markerEnd: {
          type: 'arrowclosed',
          width: 15,
          height: 15,
          color: '#d9d9d9',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#d9d9d9',
        }
      }
    ]
  };
  
  console.log('✅ 模拟知识树生成完成, 包含', tree.nodes.length, '个节点和', tree.edges.length, '条边');
  return tree;
};

// 模拟问题回答
export const mockAnswerQuestion = (question: string, nodeId: string) => {
  // 为不同节点生成不同的回答
  const answers: {[key: string]: string} = {
    'root': `这是对问题"${question}"的回答：这篇论文主要研究了...`,
    'node_1': `关于研究背景的回答："${question}" - 该领域的研究始于...`,
    'node_2': `关于研究方法的回答："${question}" - 本研究采用了以下方法...`,
    'node_3': `关于实验结果的回答："${question}" - 实验表明...`
  };

  // 生成一个新节点，作为对问题的回答
  const newNodeId = `qa_${Date.now()}`;
  
  return {
    answer: answers[nodeId] || `这是对问题"${question}"的一般回答`,
    nodes: {
      [newNodeId]: {
        id: newNodeId,
        data: { 
          label: question,
          notes: answers[nodeId] || `这是对问题"${question}"的一般回答`,
          isNotesCollapsed: false,
          isCollapsed: false,
          style: {
            backgroundColor: '#fef9c3',
            textColor: '#854d0e',
            fontSize: 14
          }
        },
        position: { x: 0, y: 0 }, // 位置将由前端布局算法决定
        type: 'mindmap',
        parentNode: nodeId
      }
    }
  };
}; 