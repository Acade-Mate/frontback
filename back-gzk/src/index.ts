import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes/api';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// 静态文件服务 - 更新为绝对路径
const uploadsPath = path.join(__dirname, '../uploads');
console.log('上传目录路径:', uploadsPath);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// 路由配置
app.use('/api', apiRouter);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 404 处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Upload directory: ${uploadsPath}`);
}); 