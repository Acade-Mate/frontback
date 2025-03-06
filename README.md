# 项目启动

1. 进入前端项目目录并安装依赖：
   ```bash
   cd frontback
   cd front-gzk
   npm install
   npm start
   ```

2. 进入后端项目目录并安装依赖：
   ```bash
   cd ../back-gzk
   npm install
   npm start
   ```

# 实现功能

1. 文件上传
2. 论文显示（Markdown 版本）
3. 知识树节点生成、节点编辑、节点拖拽、节点笔记、节点折叠、节点导出、节点导入、节点删除
4. 优化显示逻辑、拖拽逻辑、布局逻辑、画布尺寸

# TODO

1. 论文显示（PDF -> minerU -> Markdown 版本）与高亮
2. 知识树节点的更新
3. 前后端建库，数据的存储、交换
4. 编写建树相关 API
5. 代码优化、数据流设计


## 技术栈

- **前端**: 
  - React
  - TypeScript
  - React Flow
  - Axios（用于处理 HTTP 请求）
  
- **后端**: 
  - Node.js
  - Express
  - Multer（用于处理文件上传）
  - Dagre（用于图形布局）
## 文件功能说明
1. 文件上传
2. 论文查看器
3. 文本编辑
4. JSON 内容保存
5. 拖拽逻辑优化

## 运行效果

- 用户能够上传 PDF 文件并在后端保存。
- 用户可以在画布上进行文本编辑和交互。
- 编辑的内容可以保存为 JSON 格式，方便后续使用。
## 核心文件及其功能

### `README.md`

- **功能**: 项目的文档，提供项目概述、功能实现和技术栈等信息。
- **位置**:
  - `back-gzk/README.md`: 后端部分的文档。
  - `front-gzk/README.md`: 前端部分的文档。


### 前端部分

#### 1. `src/App.js`

- **功能**: 应用的入口文件，设置了基本的 React Flow 画布，初始化了节点和边的状态。
- **主要逻辑**: 使用 `useNodesState` 和 `useEdgesState` 管理节点和边的状态，并处理连接事件。

#### 2. `src/MindMap.tsx`

- **功能**: 主要的思维导图组件，负责渲染思维导图的节点和边。
- **主要逻辑**:
  - 定义了初始节点和边。
  - 使用 `getLayoutedElements` 函数计算节点的布局。
  - 提供了添加、删除、折叠节点的功能。
  - 处理节点样式的更新和导入导出 JSON 的功能。

#### 3. `src/components/MindMapNode.tsx`

- **功能**: 自定义的思维导图节点组件。
- **主要逻辑**:
  - 定义了节点的属性和样式。
  - 处理节点标签的编辑和笔记的折叠状态。
  - 使用 `memo` 优化性能，避免不必要的重新渲染。

#### 4. `src/utils/jsonConverters.ts`

- **功能**: 处理 JSON 数据格式的转换。
- **主要逻辑**:
  - `convertNGPTToMindMap`: 将 nGPT 格式的 JSON 转换为思维导图格式。
  - `convertAnyJSONToMindMap`: 将任意格式的 JSON 转换为思维导图格式。
  - `isNGPTFormat`: 检查 JSON 是否为 nGPT 格式。

#### 5. `src/types.ts`

- **功能**: 定义自定义节点数据的类型。
- **主要逻辑**: 定义了 `CustomNodeData` 接口，包含节点的标签、样式、笔记等属性。


## 自定义节点定义

自定义节点通过 `MindMapNode` 组件定义，节点的属性包括：

- `label`: 节点的标签。
- `isCollapsed`: 节点是否折叠。
- `notes`: 节点的笔记内容。
- `isNotesCollapsed`: 笔记是否折叠。
- `style`: 节点的样式，包括背景颜色、文字颜色和字体大小。

节点的样式通过 `getNodeStyle` 函数动态计算，确保在不同状态下（如选中、折叠）有不同的视觉效果。

## 触发逻辑

- **节点编辑**: 用户双击节点标签进入编辑状态，修改后失去焦点时触发 `onNodeLabelChange` 回调更新节点标签。
- **笔记折叠**: 双击笔记区域触发 `onToggleNotes` 回调，切换笔记的折叠状态。
- **添加子节点**: 点击“添加子主题”按钮，调用 `addChildNode` 函数在选中节点下添加新节点。
- **删除节点**: 点击“删除节点”按钮，调用 `onDeleteNode` 函数删除选中的节点及其子节点。
- **导入导出 JSON**: 提供导入和导出 JSON 的功能，确保用户可以保存和恢复思维导图的状态。

### 后端部分
### 1. `back-gzk/`

后端部分，负责处理 API 请求和文件上传。

#### 1.1 `src/routes/api.ts`

- **功能**: 定义 API 路由，处理文件上传和用户问题的请求。
- **主要功能**:
  - 上传 PDF 文件并返回文件信息。
  - 处理用户提问并更新知识树。

#### 1.2 `src/routes/upload.ts`

- **功能**: 处理文件上传的具体逻辑。
- **主要功能**:
  - 使用 Multer 中间件处理文件上传。
  - 确保上传目录存在并设置文件存储配置。

#### 1.3 `src/services/`

- **功能**: 提供后端服务的逻辑。
- **文件**:
  - `AlgorithmService.ts`: 处理与算法相关的逻辑。
  - `DatabaseService.ts`: 处理与数据库交互的逻辑。
  - `MockAlgorithmService.ts`: 提供模拟算法服务，用于测试。
  ### 后端部分

#### 1.4 `back-gzk/src/routes/api.ts`

- **功能**: 后端 API 路由，处理文件上传和知识树的生成。
- **主要逻辑**:
  - 使用 Multer 处理 PDF 文件的上传。
  - 生成知识树并返回给前端。

#### 1.5 `back-gzk/src/routes/upload.ts`

- **功能**: 处理文件上传的路由。
- **主要逻辑**: 确保上传目录存在，配置 Multer 存储，处理上传请求并返回文件信息。




## 2.14 初步搭建前后端以及交互，目前可以将上传的pdf保存在后端，画布添加完毕，论文显示目前是写死在本地的markdown转html 网页的嵌套。
## 2.17 新实现悬停小窗/文本编辑/文本折叠/json内容保存并且优化了拖拽逻辑（文本框的选择会导致节点的拖拽，已修复）
