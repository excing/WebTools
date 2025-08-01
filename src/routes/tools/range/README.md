# Range 对象操作工具

## 概述

Range 对象操作工具是一个专业的在线工具，用于学习和测试 DOM Range API 的各种功能。该工具提供了直观的界面来演示 Range 对象的创建、操作和应用。

## 功能特性

### 🎯 核心功能
- **文本选择检测**: 自动检测用户选择的文本并显示 Range 信息
- **Range 创建**: 程序化创建新的 Range 对象
- **内容提取**: 提取 Range 内的文本内容
- **内容克隆**: 克隆 Range 内容为文档片段
- **内容删除**: 删除 Range 内的内容
- **文本插入**: 在 Range 位置插入新文本
- **文本重置**: 重置示例文本到初始状态

### 📱 响应式设计
- 完全响应式布局，支持桌面和移动设备
- 优化的触摸交互体验
- 自适应按钮网格布局

### 🔍 SEO 优化
- 完整的 meta 标签配置
- 结构化数据 (Schema.org)
- 搜索引擎友好的 URL 结构
- 自动生成的 sitemap 条目

### 📊 分析追踪
- Google Analytics 4 事件追踪
- 用户交互行为分析
- 工具使用情况统计
- 转化漏斗追踪

## 技术实现

### 前端技术栈
- **框架**: SvelteKit 5.0 (Runes 模式)
- **样式**: 原生 CSS (响应式设计)
- **类型检查**: TypeScript
- **分析**: Firebase Analytics

### Range API 使用
```javascript
// 获取用户选择
const selection = window.getSelection();
const range = selection.getRangeAt(0);

// 创建新 Range
const newRange = document.createRange();
newRange.setStart(startNode, startOffset);
newRange.setEnd(endNode, endOffset);

// Range 操作
range.cloneContents();    // 克隆内容
range.extractContents();  // 提取内容
range.deleteContents();   // 删除内容
range.insertNode(node);   // 插入节点
```

## 教育价值

### 学习目标
1. **理解 Range 对象**: 掌握 Range 对象的基本概念和属性
2. **实践 DOM 操作**: 通过实际操作学习 DOM 节点操作
3. **文本处理技能**: 学习文本选择、提取和操作技术
4. **API 应用**: 了解 Range API 在实际项目中的应用场景

### 应用场景
- 文本编辑器开发
- 内容管理系统
- 搜索结果高亮
- 拖拽功能实现
- 复制粘贴操作
- 注释和标记系统

## 使用方法

### 基本操作
1. **选择文本**: 在示例文本区域选择任意文本
2. **获取信息**: 点击"获取当前选择"查看 Range 详细信息
3. **执行操作**: 使用各种按钮测试不同的 Range 操作
4. **查看结果**: 在结果区域查看操作的效果和反馈

### 高级功能
- **自定义 Range**: 使用"创建新 Range"按钮程序化创建选择
- **内容操作**: 测试提取、克隆、删除等内容操作
- **文本插入**: 在指定位置插入新内容
- **重置功能**: 随时重置文本到初始状态

## 浏览器兼容性

- ✅ Chrome 58+
- ✅ Firefox 52+
- ✅ Safari 11+
- ✅ Edge 79+
- ⚠️ IE 11 (部分功能受限)

## 性能优化

- 事件处理优化，避免频繁的 DOM 操作
- 响应式图片和资源加载
- CSS 和 JavaScript 代码分割
- 缓存策略优化

## 安全考虑

- 输入内容过滤和验证
- XSS 攻击防护
- 安全的 DOM 操作实践
- 用户数据隐私保护

## 开发和测试

### 本地开发
```bash
npm run dev
```

### 测试页面
访问 `/tools/range/test-range.html` 查看独立的测试页面，包含更多测试用例和功能演示。

### 构建部署
```bash
npm run build
npm run preview
```

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个工具。请确保：

1. 代码符合项目的编码规范
2. 添加适当的测试用例
3. 更新相关文档
4. 保持响应式设计兼容性

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

## 更新日志

### v1.0.0 (2025-01-01)
- 初始版本发布
- 基础 Range 操作功能
- 响应式设计实现
- SEO 优化完成
- 分析追踪集成
