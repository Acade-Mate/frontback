import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { mockGenerateKnowledgeTree, mockAnswerQuestion } from './MockAlgorithmService';

// 算法服务的基础URL
const ALGORITHM_SERVICE_URL = process.env.ALGORITHM_SERVICE_URL || 'http://localhost:5000/api';

class AlgorithmService {
  // 4-5. 请求构建知识树
  static async generateKnowledgeTree(filePath: string, fileId: string) {
    try {
      console.log(`请求算法服务构建知识树: ${filePath}`);
      
      // 使用模拟数据而不是调用真实服务
      return mockGenerateKnowledgeTree(fileId);
      
      // 以下代码在真实环境中使用，现在注释掉
      // const response = await axios.post(`${ALGORITHM_SERVICE_URL}/analyze`, {
      //   filePath,
      //   fileId,
      // });
      // return response.data;
    } catch (error) {
      console.error('请求算法服务失败:', error);
      throw error;
    }
  }

  // 12-13. 请求回答问题
  static async getAnswer(fileId: string, nodeId: string, question: string) {
    try {
      console.log(`请求算法服务回答问题: ${question}`);
      
      // 使用模拟数据
      return mockAnswerQuestion(question, nodeId);
      
      // 注释掉真实API调用
      // const response = await axios.post(`${ALGORITHM_SERVICE_URL}/answer`, {
      //   fileId,
      //   nodeId,
      //   question,
      // });
      // return response.data;
    } catch (error) {
      console.error('请求回答失败:', error);
      throw error;
    }
  }
}

export default AlgorithmService; 