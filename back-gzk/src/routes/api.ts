import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import AlgorithmService from '../services/AlgorithmService';
import DatabaseService from '../services/DatabaseService';
import { mockGenerateKnowledgeTree } from '../services/MockAlgorithmService';

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只接受 PDF 文件！'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 1-3. 上传论文并存储元数据
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  console.log('📥 收到PDF上传请求');
  
  try {
    if (!req.file) {
      console.log('❌ 未接收到文件');
      return res.status(400).json({ 
        success: false, 
        message: '没有接收到文件' 
      });
    }

    console.log('✅ 文件上传成功:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 生成文件ID
    const fileId = uuidv4();
    console.log('📋 生成的文件ID:', fileId);
    
    // 生成知识树
    console.log('🔍 开始生成知识树...');
    const knowledgeTree = mockGenerateKnowledgeTree(fileId);
    console.log('✅ 知识树生成完成, 节点数量:', knowledgeTree.nodes.length);
    
    // 构建响应
    const response = {
      success: true,
      message: '文件上传成功并生成知识树',
      file: {
        id: fileId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        url: `/uploads/${req.file.filename}`
      },
      knowledgeTree
    };
    
    console.log('📤 发送响应: 成功');
    res.json(response);

  } catch (error) {
    console.error('❌ 上传处理错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '处理文件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取知识树
router.get('/knowledge-tree/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const knowledgeTree = await DatabaseService.getKnowledgeTree(fileId);
    
    res.json({
      success: true,
      knowledgeTree
    });
  } catch (error) {
    console.error('获取知识树失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取知识树失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 11-15. 处理用户问题并更新知识树
router.post('/ask-question', async (req, res) => {
  try {
    const { fileId, nodeId, question } = req.body;
    
    if (!fileId || !nodeId || !question) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 12-13. 调用算法服务获取回答
    const answerData = await AlgorithmService.getAnswer(fileId, nodeId, question);
    
    // 14. 更新知识树
    const updatedTree = await DatabaseService.updateKnowledgeTree(fileId, {
      nodes: {
        ...answerData.nodes
      }
    });
    
    // 15. 返回更新数据
    res.json({
      success: true,
      answer: answerData.answer,
      updatedTree
    });
    
  } catch (error) {
    console.error('处理问题失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '处理问题失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export { router as apiRouter }; 