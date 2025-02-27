import fs from 'fs';
import path from 'path';

// 在实际项目中，这里应该使用真实的数据库，如MongoDB或PostgreSQL
// 本示例使用文件系统模拟数据库操作
class DatabaseService {
  static dataDir = path.join(__dirname, '../../data');
  
  constructor() {
    // 确保数据目录存在
    if (!fs.existsSync(DatabaseService.dataDir)) {
      fs.mkdirSync(DatabaseService.dataDir, { recursive: true });
    }
  }
  
  // 3. 存储文件元数据
  static async saveFileMetadata(fileId: string, metadata: any) {
    try {
      const filePath = path.join(DatabaseService.dataDir, `file_${fileId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2));
      return { success: true };
    } catch (error) {
      console.error('保存文件元数据失败:', error);
      throw error;
    }
  }
  
  // 7. 存储知识树
  static async saveKnowledgeTree(fileId: string, knowledgeTree: any) {
    try {
      const filePath = path.join(DatabaseService.dataDir, `tree_${fileId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(knowledgeTree, null, 2));
      return { success: true };
    } catch (error) {
      console.error('保存知识树失败:', error);
      throw error;
    }
  }
  
  // 获取知识树
  static async getKnowledgeTree(fileId: string) {
    try {
      const filePath = path.join(DatabaseService.dataDir, `tree_${fileId}.json`);
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('获取知识树失败:', error);
      throw error;
    }
  }
  
  // 14. 更新知识树
  static async updateKnowledgeTree(fileId: string, updates: any) {
    try {
      // 获取现有知识树
      const tree = await this.getKnowledgeTree(fileId);
      
      // 应用更新
      const updatedTree = {
        ...tree,
        ...updates,
      };
      
      // 保存更新后的知识树
      await this.saveKnowledgeTree(fileId, updatedTree);
      
      return updatedTree;
    } catch (error) {
      console.error('更新知识树失败:', error);
      throw error;
    }
  }
}

export default DatabaseService; 