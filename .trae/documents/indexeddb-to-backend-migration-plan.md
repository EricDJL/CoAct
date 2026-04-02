# IndexedDB 到后端数据库迁移计划

## 现状分析

### 当前 IndexedDB 存储的数据（Dexie）
1. **stages** - 课程基本信息
2. **scenes** - 场景/页面数据
3. **audioFiles** - 音频文件（TTS）
4. **imageFiles** - 图片文件
5. **snapshots** - 撤销/重做快照（legacy）
6. **chatSessions** - 聊天会话
7. **playbackState** - 播放状态
8. **stageOutlines** - 课程大纲
9. **mediaFiles** - AI生成的媒体文件（图片/视频）
10. **generatedAgents** - AI生成的代理档案

### 后端数据库（Prisma/PostgreSQL）已有的模型
- ✅ Stage - 课程基本信息
- ✅ Scene - 场景数据
- ✅ ChatSession - 聊天会话
- ✅ GeneratedAgent - 生成的代理
- ✅ MediaFile - 媒体文件
- ✅ AudioFile - 音频文件
- ✅ ImageFile - 图片文件
- ✅ ClassroomJob - 课程生成任务
- ❌ PlaybackState - 播放状态（缺失）
- ❌ StageOutlines - 课程大纲（缺失）

## 迁移目标

1. **完全移除 IndexedDB 依赖** - 所有数据存储统一使用后端数据库
2. **补全缺失的数据表** - 添加 PlaybackState 和 StageOutlines 模型
3. **更新所有存储层** - 将 storage 层从 IndexedDB 改为 API 调用
4. **更新前端组件** - 更新所有使用 IndexedDB 的组件
5. **提供数据迁移工具** - 帮助用户从 IndexedDB 迁移现有数据

## 实施步骤

### 阶段一：数据库 Schema 完善
1. 更新 `prisma/schema.prisma`，添加缺失的模型：
   - `PlaybackState` - 播放状态
   - `StageOutlines` - 课程大纲
   - 完善现有模型的字段（确保与 IndexedDB 一致）
2. 运行 Prisma 迁移

### 阶段二：后端 API 完善
1. 创建新的服务器存储模块：
   - `lib/server/chat-session-storage-db.ts` - 聊天会话存储
   - `lib/server/playback-storage-db.ts` - 播放状态存储
   - `lib/server/stage-outlines-storage-db.ts` - 课程大纲存储
   - `lib/server/media-file-storage-db.ts` - 媒体文件存储
   - `lib/server/audio-file-storage-db.ts` - 音频文件存储
   - `lib/server/image-file-storage-db.ts` - 图片文件存储
   - `lib/server/generated-agent-storage-db.ts` - 生成代理存储

2. 创建/完善 API 路由：
   - `app/api/chat-sessions/route.ts` - 聊天会话 CRUD
   - `app/api/playback-state/route.ts` - 播放状态 CRUD
   - `app/api/stage-outlines/route.ts` - 课程大纲 CRUD
   - `app/api/media-files/route.ts` - 媒体文件 CRUD
   - `app/api/audio-files/route.ts` - 音频文件 CRUD
   - `app/api/image-files/route.ts` - 图片文件 CRUD
   - `app/api/generated-agents/route.ts` - 生成代理 CRUD
   - 完善 `app/api/classroom/route.ts` 的 DELETE 方法

### 阶段三：前端 API 服务层完善
1. 更新 `lib/client/api-service.ts`，添加新的 API 方法：
   - 聊天会话相关方法
   - 播放状态相关方法
   - 课程大纲相关方法
   - 媒体文件相关方法
   - 音频文件相关方法
   - 图片文件相关方法
   - 生成代理相关方法

### 阶段四：存储层重构
1. 更新 `lib/utils/stage-storage.ts` - 完全使用 API，移除 IndexedDB
2. 更新 `lib/utils/chat-storage.ts` - 完全使用 API，移除 IndexedDB
3. 更新 `lib/utils/playback-storage.ts` - 完全使用 API，移除 IndexedDB
4. 更新 `lib/utils/image-storage.ts` - 完全使用 API/OSS，移除 IndexedDB
5. 创建 `lib/utils/stage-outlines-storage.ts` - 新的存储模块
6. 创建 `lib/utils/media-file-storage.ts` - 新的存储模块
7. 创建 `lib/utils/audio-file-storage.ts` - 新的存储模块
8. 创建 `lib/utils/generated-agent-storage.ts` - 新的存储模块

### 阶段五：前端组件更新
1. 更新所有使用 IndexedDB 的组件和 hooks：
   - `lib/store/stage.ts`
   - `lib/store/snapshot.ts`
   - `lib/store/media-generation.ts`
   - `components/chat/use-chat-sessions.ts`
   - 其他使用 storage 的组件

### 阶段六：数据迁移工具
1. 创建前端数据迁移工具：
   - 从 IndexedDB 读取所有数据
   - 通过 API 上传到后端数据库
   - 提供迁移进度显示
   - 支持重试和错误处理

### 阶段七：清理和测试
1. 移除不再需要的 IndexedDB 相关代码
2. 更新初始化流程，移除 IndexedDB 初始化
3. 全面测试所有功能
4. 更新文档

## 注意事项

1. **媒体文件处理**：Blob 数据应该上传到 OSS，数据库只存储 URL
2. **向后兼容**：先完成后端和 API 层，再逐步替换前端
3. **错误处理**：API 调用失败时要有合理的降级处理
4. **性能考虑**：对于大量数据，考虑分页加载
