import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { convertNGPTToMindMap, isNGPTFormat } from './jsonConverters';

// 读取 nGPT_tree_r1.json
const ngptData = JSON.parse(
  readFileSync(
    join(__dirname, '../../../nGPT_tree_r1.json'), 
    'utf-8'
  )
);

// 检查格式
console.log('Is nGPT format:', isNGPTFormat(ngptData));

// 转换
const result = convertNGPTToMindMap(ngptData);

// 输出结果
console.log('\nConverted nodes:', result.nodes.length);
console.log('Converted edges:', result.edges.length);
console.log('\nSample node:', JSON.stringify(result.nodes[0], null, 2));
console.log('\nSample edge:', JSON.stringify(result.edges[0], null, 2));

// 将转换结果写入文件
writeFileSync(
  join(__dirname, './__tests__/converted_mindmap.json'),
  JSON.stringify(result, null, 2),
  'utf-8'
);

// 创建一个简化版本，只包含关键信息
const simplifiedResult = {
  nodes: result.nodes.map(node => ({
    id: node.id,
    parentId: result.edges.find(edge => edge.target === node.id)?.source,
    label: node.data.label,
    notes: node.data.notes
  }))
};

// 将简化版本写入文件
writeFileSync(
  join(__dirname, './__tests__/simplified_mindmap.json'),
  JSON.stringify(simplifiedResult, null, 2),
  'utf-8'
);

console.log('\nConversion results have been written to:');
console.log('1. __tests__/converted_mindmap.json (完整版)');
console.log('2. __tests__/simplified_mindmap.json (简化版)'); 