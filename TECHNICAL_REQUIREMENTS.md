# AI交互式课堂系统 (CoAct) 技术招聘要求

## 项目概述
CoAct  AI交互式课堂系统，能够将PDF文档即时转换为沉浸式、多智能体的学习体验。项目采用现代化的技术栈，融合了AI、富文本编辑、音视频处理等多种技术，为教育领域提供创新的解决方案。

## 核心技术栈

### 基础框架
- **Next.js 16.1.2** (App Router模式)
- **React 19.2.3**
- **TypeScript** (严格类型检查)
- **Node.js 20.9.0+**

### UI/样式系统
- **Tailwind CSS 4**
- **Shadcn UI** 组件库
- **Radix UI** 组件库
- **Framer Motion** (动画效果)
- **clsx/tailwind-merge** (类名管理)
- **Geist** 字体

### 状态管理
- **Zustand** (全局状态管理)
- **React Hooks** (组件状态管理)

### AI集成
- **AI SDK** (OpenAI、Anthropic、Google)
- **LangChain Core** 和 **LangGraph** (AI工作流管理)
- **CopilotKit** (辅助功能)

### 数据处理
- **Zod** (数据验证)
- **ProseMirror** (富文本编辑)
- **Katex/Temml** (数学公式渲染)
- **ECharts** (图表展示)

### 工具库
- **Lodash** (工具函数)
- **Nanoid** (唯一ID生成)
- **js-yaml** (YAML处理)
- **file-saver** (文件保存)
- **Dexie** (IndexedDB封装)

### 特定领域技术
- **PPTX生成和解析** (pptxgenjs、pptxtojson)
- **PDF处理** (unpdf)
- **图像处理** (Sharp、@napi-rs/canvas)
- **音视频处理** (Azure Voices)
- **知识图谱/流程可视化** (@xyflow/react)

## 前端开发技术要求

### 框架与基础
- 深入理解Next.js 16的App Router模式、Server Components和Client Components
- 精通React 19的新特性，包括并发渲染、Suspense等
- 熟练使用TypeScript，能够编写类型安全的代码
- 熟悉React Hooks的设计模式和最佳实践

### UI开发
- 熟练使用Tailwind CSS 4进行响应式设计
- 熟悉Shadcn UI和Radix UI组件库的使用和定制
- 能够使用Framer Motion实现流畅的动画效果
- 了解无障碍设计(WCAG)的基本要求

### 状态管理
- 熟练使用Zustand进行全局状态管理
- 了解状态管理的最佳实践，包括状态拆分、性能优化等
- 熟悉React Context API的使用场景

### 数据处理
- 熟练使用Zod进行数据验证和类型定义
- 了解ProseMirror的基本架构和使用方法
- 能够集成第三方库如Katex/Temml进行数学公式渲染

### 性能优化
- 熟悉React性能优化的方法，包括memo、useMemo、useCallback等
- 了解Next.js的性能优化策略，如静态生成、增量静态再生等
- 能够使用Chrome DevTools进行性能分析和调优

## 后端开发技术要求

### Next.js API路由
- 熟练使用Next.js的App Router中的API路由
- 了解服务器组件和客户端组件的交互方式
- 熟悉API路由的认证和授权机制

### AI集成
- 熟悉AI SDK的使用，包括OpenAI、Anthropic、Google等
- 了解LangChain Core和LangGraph的基本概念和使用方法
- 能够设计和实现AI工作流和代理系统

### 数据处理
- 熟练处理各种文件格式，包括PDF、PPTX、图像等
- 了解图像处理的基本技术，如缩放、裁剪、格式转换等
- 熟悉音视频处理的基本概念和技术

### 性能与安全
- 了解服务器性能优化的方法，包括缓存、并发处理等
- 熟悉API安全的基本要求，如输入验证、防止SQL注入等
- 了解CORS、CSRF等安全概念和防护方法

## AI相关技术要求

### AI模型集成
- 熟练使用各种AI模型，包括大语言模型、图像生成模型等
- 了解AI模型的参数调优和性能优化
- 能够设计和实现提示工程

### AI工作流
- 熟悉使用LangChain和LangGraph构建复杂的AI工作流
- 了解多代理系统的设计和实现
- 能够处理AI生成内容的质量控制

### 特定领域AI应用
- 了解教育领域的AI应用场景和需求
- 熟悉自适应学习、个性化教育等概念
- 能够将AI技术应用于教育内容生成和交互设计

## 数据处理技术要求

### 文档处理
- 熟练处理PDF文档，包括提取文本、图像、结构等
- 了解PPTX文件的生成和解析技术
- 能够处理各种文档格式的转换

### 富文本编辑
- 熟悉ProseMirror的基本架构和扩展机制
- 能够实现自定义的富文本编辑功能
- 了解数学公式、图表等特殊内容的编辑和渲染

### 本地存储
- 熟练使用IndexedDB进行本地数据存储
- 了解Dexie.js等IndexedDB封装库的使用
- 能够设计本地数据存储的结构和策略

## 特定领域技术要求

### 教育科技
- 了解教育科技领域的基本概念和趋势
- 熟悉在线教育、交互式学习等相关技术
- 能够理解和实现教育相关的功能需求

### 音视频技术
- 了解音频处理的基本技术，包括语音识别、文本转语音等
- 熟悉Azure Voices等语音服务的使用
- 能够实现音频播放、录制等功能

### 可视化技术
- 熟练使用@xyflow/react等库实现流程图、知识图谱等可视化功能
- 了解ECharts等图表库的使用
- 能够设计直观、易用的可视化界面

## 开发工具链

### 代码质量与格式化
- **ESLint** (代码质量检查)
- **Prettier** (代码格式化)
- 严格遵循TypeScript类型检查

### 测试
- **Vitest** (单元测试)
- **Playwright** (端到端测试)
- 熟悉测试驱动开发(TDD)的基本概念

### 版本控制
- **Git** (版本控制)
- 熟悉GitHub的工作流程和协作方式
- 了解Git分支管理策略

### 构建与部署
- 熟悉Next.js的构建和部署流程
- 了解Docker容器化技术
- 熟悉CI/CD流程的设计和实现

## 技能与经验要求

### 通用要求
- 本科及以上学历，计算机相关专业
- 3年以上相关开发经验
- 良好的编程习惯和代码风格
- 优秀的问题分析和解决能力
- 良好的团队协作和沟通能力

### 前端开发工程师
- 3年以上React开发经验，熟悉React 19的新特性
- 2年以上Next.js开发经验，熟悉App Router模式
- 熟练使用TypeScript，能够编写类型安全的代码
- 熟悉Tailwind CSS、Shadcn UI等UI框架
- 有复杂前端应用开发经验，包括状态管理、性能优化等

### 后端开发工程师
- 3年以上Node.js开发经验
- 2年以上Next.js API路由开发经验
- 熟悉AI SDK和LangChain等AI相关技术
- 有文档处理、图像处理等相关开发经验
- 了解服务器性能优化和安全防护

### AI工程师
- 2年以上AI相关开发经验
- 熟悉大语言模型的应用和开发
- 熟练使用LangChain、LangGraph等AI框架
- 有提示工程、AI工作流设计经验
- 了解教育科技领域优先

## 加分项
- 有开源项目贡献经验
- 有教育科技领域项目经验
- 有AI应用开发经验
- 熟悉Rust或Python等其他编程语言
- 有音视频处理相关经验
- 有大数据处理或机器学习相关经验
- 能够独立完成复杂功能的设计和实现

## 项目资源
- 项目代码库：[GitHub - CoAct]
- 技术文档：项目内部文档
- 开发环境：Node.js 20.9.0+, pnpm
