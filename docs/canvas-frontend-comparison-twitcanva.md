# 当前项目与 TwitCanva 画布前端对比备忘录

本文档用于以后新窗口快速理解两个项目的画布前端差异，避免每次重新阅读大量文件。

对比范围只包含前端 canvas 功能：

- 当前项目：`/Users/a1/Desktop/infinite-canvas`
- 当前项目画布前端：`web/src/app/(user)/canvas/`
- 对比项目：`/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src`
- 不比较两个项目的后端，因为用户会使用另一个后端，不使用这两个项目的后端。

## 快速结论

如果目标是继续开发当前项目的画布前端，建议以当前项目 `infinite-canvas` 的画布作为主线。

理由：

- 当前项目的画布数据结构更干净，节点保存真实 `position / width / height`，适合作为长期维护的无限画布底座。
- 当前项目已经和 Next.js App Router、Ant Design、Tailwind、Zustand、localforage、当前素材/配置体系融合。
- 当前项目不强依赖某个 Node 后端，画布项目和媒体数据可本地持久化，也支持 zip 导入导出，更适合未来接入新的后端。
- 当前项目的画布基础交互更扎实，包括真实尺寸命中、视口裁剪、节点缩放、连线吸附、多媒体节点、批量图片组、助手面板、素材插入等。

`TwitCanva-Video-Workflow` 更适合作为功能参考库，不适合作为整体迁移目标。

理由：

- 它的视频创作链路更丰富，例如 storyboard、多图参考、首尾帧、motion control、视频编辑、图像编辑、社媒发布等。
- 但它的前端与自己的后端、模型协议、工作流保存接口、社媒、本地模型等耦合较重。
- 它的节点数据结构把大量业务字段塞进同一个 `NodeData`，后续接新后端时改造成本高。
- 它有不少画布命中和尺寸估算使用固定宽高，作为无限画布底座不如当前项目稳。

一句话判断：

当前项目赢在“工程底座、可维护方向、当前技术栈适配、无后端依赖能力”；`TwitCanva` 赢在“短视频创作工作流的功能密度和交互想法”。

## 以后怎么使用这份文档

常见任务选择：

- 如果任务是改当前画布基础能力，例如节点、连线、缩放、拖拽、选择、存储、导入导出，优先读当前项目文件，不需要读 `TwitCanva`。
- 如果任务是做视频工作流、storyboard、首尾帧、图像编辑器、视频编辑器、分组编排，可以先读本文档中列出的 `TwitCanva` 参考文件。
- 如果任务是拆当前 `canvas-client-page.tsx`，优先读 `docs/canvas-client-page-hooks-refactor.md`。
- 如果任务涉及后端 API，不要参考 `TwitCanva` 的后端接口写法，用户明确不用这两个项目后端。

## 当前项目画布前端概览

核心路径：

```text
web/src/app/(user)/canvas/
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
web/src/app/(user)/canvas/[id]/page.tsx
web/src/app/(user)/canvas/page.tsx
web/src/app/(user)/canvas/types.ts
web/src/app/(user)/canvas/constants.ts
web/src/app/(user)/canvas/stores/use-canvas-store.ts
web/src/app/(user)/canvas/stores/use-canvas-ui-store.ts
web/src/app/(user)/canvas/components/
web/src/app/(user)/canvas/utils/
```

当前项目技术栈：

- Next.js App Router
- React
- TypeScript
- Ant Design
- Tailwind
- Zustand
- localforage
- lucide-react

主要数据结构：

- `CanvasNodeData`
- `CanvasConnection`
- `CanvasProject`
- `CanvasAssistantSession`
- `ViewportTransform`

当前项目节点类型：

- `Image`
- `Text`
- `Config`
- `Video`
- `Audio`

当前项目关键文件职责：

- `types.ts`：画布节点、连线、视口、助手会话、选择框、右键菜单等类型。
- `stores/use-canvas-store.ts`：画布项目列表、项目节点/连线/会话/主题/视口的本地持久化。
- `components/infinite-canvas.tsx`：画布容器、网格背景、缩放、平移、基础指针交互。
- `components/canvas-node.tsx`：节点渲染、文本编辑、图片/视频/音频展示、节点缩放、连接点。
- `components/canvas-connections.tsx`：SVG 连线路径、活动连线。
- `components/canvas-toolbar.tsx`：底部工具栏。
- `components/canvas-node-hover-toolbar.tsx`：节点悬浮工具条和节点信息弹窗。
- `components/canvas-config-node-panel.tsx`：配置节点内生成控制。
- `components/canvas-assistant-panel.tsx`：画布助手面板。
- `components/asset-picker-modal.tsx`：素材选择弹窗。
- `utils/canvas-resource-references.ts`：从节点和连线解析生成上下文资源引用。
- `components/canvas-node-generation.ts`：基于节点和连线构造生成上下文、聊天消息、引用图片/视频/音频。
- `utils/canvas-export.ts`：画布项目 zip 导出。

当前项目最重文件：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- 当前约 3000 行。
- 它是当前画布前端最大的维护压力点。
- 下一步应按 `docs/canvas-client-page-hooks-refactor.md` 逐步拆成页面私有 hooks。

## TwitCanva 画布前端概览

核心路径：

```text
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/App.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/types.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/services/
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/utils/
```

TwitCanva 技术栈：

- Vite
- React
- TypeScript
- lucide-react
- 自写样式和 Tailwind 风格 class
- Three.js / react-three 依赖存在
- face-api.js
- 多种 AI SDK / 服务依赖

TwitCanva 节点类型：

- `TEXT`
- `IMAGE`
- `VIDEO`
- `AUDIO`
- `IMAGE_EDITOR`
- `VIDEO_EDITOR`
- `STORYBOARD`
- `CAMERA_ANGLE`
- `LOCAL_IMAGE_MODEL`
- `LOCAL_VIDEO_MODEL`

TwitCanva 关键文件职责：

- `App.tsx`：主应用总控，挂载所有 hook、面板、弹窗、画布、节点、连线。
- `types.ts`：节点、视口、选择框、分组等类型。
- `components/canvas/CanvasNode.tsx`：节点外壳、特殊节点渲染、节点标题、节点控制区域组合。
- `components/canvas/NodeContent.tsx`：节点内容区，包含图片、视频、文本、上传、占位和结果展示。
- `components/canvas/NodeControls.tsx`：节点控制面板，包含 prompt、模型、比例、分辨率、时长、视频高级设置、本地模型等。
- `components/canvas/ConnectionsLayer.tsx`：SVG 连线。
- `components/canvas/SelectionBoundingBox.tsx`：多选/分组选框、分组工具、排序、创建视频入口。
- `hooks/useCanvasNavigation.ts`：视口、缩放、平移。
- `hooks/useNodeManagement.ts`：节点创建、更新、删除、选择。
- `hooks/useNodeDragging.ts`：节点拖拽和平移。
- `hooks/useConnectionDragging.ts`：连线拖拽、命中、连接规则。
- `hooks/useSelectionBox.ts`：框选。
- `hooks/useGeneration.ts`：图片/视频/本地模型生成。
- `hooks/useGroupManagement.ts`：分组、取消分组、排列、重命名。
- `hooks/useHistory.ts`：撤销/重做。
- `hooks/useWorkflow.ts`：保存/加载工作流，但绑定自己的后端。
- `hooks/useStoryboardGenerator.ts`：storyboard 生成流程。
- `components/modals/ImageEditorModal.tsx`：图像编辑器弹窗。
- `components/modals/VideoEditorModal.tsx`：视频编辑器弹窗。
- `components/modals/StoryboardGeneratorModal.tsx`：storyboard 生成弹窗。
- `components/modals/StoryboardVideoModal.tsx`：storyboard 图片批量生成视频弹窗。

## 结构对比

### 当前项目结构优点

当前项目的画布结构更贴合本仓库：

- 画布代码收束在 `web/src/app/(user)/canvas/` 下，边界清楚。
- 画布项目 store 独立，项目维度包括节点、连线、会话、主题、视口等。
- 节点数据保存真实 `width` 和 `height`，避免框选、连线、缩放和实际视觉脱节。
- 图片、视频、音频媒体都通过当前项目的存储服务处理，刷新可恢复。
- `canvasResourceReferences` 和 `canvas-node-generation` 已经把“节点连线 -> 生成上下文”抽出来一部分。
- 导入导出可把画布项目和本地媒体打包成 zip，前端自洽。
- 和当前用户系统、主题、配置、素材库、文档入口等现有功能融合更好。

### 当前项目结构缺点

当前项目的最大问题是 `canvas-client-page.tsx` 过重：

- 页面组件维护了几十个 state 和 refs。
- 历史、项目加载、拖拽、框选、连线、快捷键、上传、生成、图片工具都混在一个文件。
- 生成逻辑集中在一个很大的 `handleGenerateNode` 里，图片/视频/音频/文本分支都在同一函数中。
- 节点工具动作很多，hover toolbar 传入大量回调。
- 后续如果直接继续堆功能，维护成本会快速上升。

推荐处理：

- 不重写画布。
- 先按 `docs/canvas-client-page-hooks-refactor.md` 做渐进式拆 hook。
- 优先拆低风险模块：类型/工具函数、latest refs、viewport、history、connections、selection、clipboard。
- 最后再拆生成逻辑和图片工具。

### TwitCanva 结构优点

TwitCanva 把一部分交互逻辑拆成 hooks，模块名直观：

- `useNodeManagement`
- `useNodeDragging`
- `useConnectionDragging`
- `useSelectionBox`
- `useGeneration`
- `useHistory`
- `useGroupManagement`
- `useWorkflow`

这对当前项目拆 `canvas-client-page.tsx` 有参考价值。

TwitCanva 的产品功能也拆出多个独立面板/弹窗：

- WorkflowPanel
- HistoryPanel
- AssetLibraryPanel
- ChatPanel
- ImageEditorModal
- VideoEditorModal
- StoryboardGeneratorModal
- StoryboardVideoModal

这些文件可以作为“视频工作流产品形态”的参考。

### TwitCanva 结构缺点

TwitCanva 的拆分不等于底层更好：

- `App.tsx` 仍然是一个大型总控组件，负责拼接大量 hook、弹窗、节点映射、面板状态和业务事件。
- `CanvasNode.tsx` 和 `NodeControls.tsx` 很重，节点类型特判非常多。
- `NodeData` 根级字段过多，把图像模型、视频模型、视频编辑、图像编辑、本地模型、storyboard、人脸检测都塞在一起。
- 保存/加载工作流写死到 `http://localhost:3001`，与用户未来的新后端不匹配。
- 很多画布基础命中依赖固定宽高估算，不适合直接搬进当前项目。
- 业务功能和特定模型协议耦合较重，例如 Kling、Veo、Hailuo、本地模型、社媒发布。

## 功能对比

### 当前项目更强的功能

当前项目在这些方向更适合作为主线：

- 通用无限画布基础交互。
- 节点真实尺寸和比例控制。
- 图片、文本、配置、视频、音频五类基础节点。
- 图片节点保留原始比例，支持自由缩放切换。
- 批量图片生成后以图片组形式展示，支持主图和折叠/展开。
- 画布连线吸附和真实节点命中。
- 连接节点到配置节点后解析上游参考资源。
- 生成上下文支持图片、视频、音频、文本资源编号。
- 画布助手会话和画布项目一起保存。
- 本地项目持久化和 zip 导入导出。
- 与当前项目的素材库、“我的素材”、主题、用户状态、AI 配置融合。

### TwitCanva 更强的功能

TwitCanva 在这些方向更适合作为参考：

- 短视频创作工作流。
- storyboard 生成和 storyboard 图片批量转视频。
- 节点分组、分组选框、分组排序。
- 图片编辑器：画笔、箭头、文字、裁剪、编辑历史。
- 视频编辑器：裁剪/导出。
- 视频生成链路：首帧、尾帧、motion control、父视频 last frame。
- 多模型面板：不同视频模型的能力、时长、分辨率、参考输入限制。
- 历史面板和素材面板的产品入口。
- 拖节点到聊天面板这类交互想法。

### 两者都存在的问题

当前项目和 TwitCanva 都有一个共同问题：

- 总控组件仍然太大。

当前项目是 `canvas-client-page.tsx` 太重。

TwitCanva 是 `App.tsx`、`CanvasNode.tsx`、`NodeControls.tsx` 太重。

所以未来最佳路线不是把一个整体替换另一个，而是：

- 保留当前项目的数据结构和画布底座。
- 借鉴 TwitCanva 的功能模块和 hook 拆分思路。
- 按当前项目规范重写/吸收需要的功能。

## 数据结构对比

### 当前项目节点结构

当前项目 `CanvasNodeData` 核心字段：

```ts
type CanvasNodeData = {
    id: string;
    type: CanvasNodeType;
    title: string;
    position: Position;
    width: number;
    height: number;
    metadata?: CanvasNodeMetadata;
};
```

优点：

- 节点基础几何信息清楚。
- 业务扩展集中在 `metadata`。
- 连线、框选、节点缩放都能使用真实尺寸。
- 后续新增节点类型时可以保持基础模型稳定。

缺点：

- `metadata` 已经在变大，未来需要注意不要把所有业务都无结构地塞进去。
- 当前没有专门的节点子类型 discriminated union，类型约束不够强。

建议：

- 保持当前基础结构。
- 后续如果要增强类型，可以在 `metadata` 上做分类型工具，而不是改整个存储格式。

### TwitCanva 节点结构

TwitCanva `NodeData` 核心特点：

- `x`、`y` 保存位置，但没有统一真实 `width`、`height`。
- 根级字段非常多。
- 视频、图像、本地模型、编辑器、storyboard、人脸检测都在同一个 interface 中。

优点：

- 快速原型很方便。
- 某个节点拿到 `NodeData` 就能读到几乎所有业务字段。

缺点：

- 节点模型耦合过重。
- 字段可选项过多，运行时判断复杂。
- 不适合直接作为当前项目长期存储格式。
- 接新后端时容易被旧模型字段和旧服务协议牵制。

建议：

- 不要迁移 TwitCanva 的 `NodeData`。
- 可以参考它某些功能字段的语义，例如 `frameInputs`、`lastFrame`、`storyContext`，但应按当前项目 `metadata` 或独立结构重新设计。

## 画布交互对比

### 当前项目交互特点

当前项目：

- `InfiniteCanvas` 负责背景网格、平移、缩放。
- 节点拖拽在 `canvas-client-page.tsx` 内完成。
- 框选使用世界坐标。
- 连线命中用真实节点位置和尺寸。
- 节点缩放在 `CanvasNode` 内完成，图片/视频可保持比例。
- 可见节点做了视口裁剪，只渲染可见区域内节点。

优点：

- 适合真正无限画布。
- 对图片/视频真实尺寸友好。
- 未来节点数量增加时更有优化基础。

缺点：

- 逻辑分散在页面大文件和节点组件中。
- 拖拽、框选、连线还没有独立 hooks。

### TwitCanva 交互特点

TwitCanva：

- `useCanvasNavigation` 管缩放和平移。
- `useNodeDragging` 管节点拖拽。
- `useConnectionDragging` 管连线拖拽。
- `useSelectionBox` 管框选。
- `SelectionBoundingBox` 管多选/分组框。

优点：

- 模块命名直观。
- 拆分方向值得参考。
- 分组交互比当前项目更完整。

缺点：

- 多处使用固定宽高估算命中区域。
- 连线和框选不总是等于真实视觉尺寸。
- 节点尺寸计算逻辑分散在多个组件中，有重复。

建议：

- 当前项目可以借鉴 hook 拆分命名和职责。
- 不要搬固定宽高命中算法。
- 如果当前项目要做分组，可以借鉴 `SelectionBoundingBox` 的产品形态，但底层尺寸计算要改成真实 `node.width/height`。

## 生成流程对比

### 当前项目生成流程

当前项目生成逻辑主要在 `canvas-client-page.tsx` 和 `components/canvas-node-generation.ts`：

- `buildNodeGenerationContext`
- `buildNodeGenerationInputs`
- `hydrateNodeGenerationContext`
- `buildNodeChatMessages`
- `handleGenerateNode`
- `handleRetryNode`

支持：

- 文本生成。
- 图片生成。
- 图生图/参考图编辑。
- 多图批量生成。
- 视频生成。
- 音频生成。
- 配置节点统一配置模型、尺寸、质量、数量等。
- 上游图片、文本、视频、音频资源引用。

优点：

- 和当前项目 AI 配置体系融合。
- 支持音频节点和视频/音频参考。
- 多图 batch 形态已经和画布展示结合。

缺点：

- `handleGenerateNode` 过大。
- 生成状态、节点创建、API 请求、结果入库、错误处理混在一起。

建议：

- 暂时保留行为。
- 最后拆成 `useCanvasGeneration`。
- 先搬函数，不重构内部算法。

### TwitCanva 生成流程

TwitCanva 生成逻辑主要在 `hooks/useGeneration.ts`：

- 从父节点收集文本 prompt。
- 从父节点收集图片参考。
- 支持多图输入。
- 支持 storyboard character references。
- 支持本地模型。
- 支持视频 start/end frame。
- 支持 Kling 2.6 motion control。
- 支持视频 last frame 提取后用于后续视频链路。

优点：

- 视频工作流更完整。
- `useGeneration` 抽成 hook 的方向值得参考。
- `lastFrame` 和 `frameInputs` 很适合视频链式生成。

缺点：

- 强绑定自己的服务函数和模型参数。
- 模型规则写死较多。
- 错误提示、cache busting、文件 URL 处理依赖自己的后端行为。

建议：

- 只借鉴“视频链路能力”，不搬服务调用。
- 如果当前项目以后要支持首尾帧视频生成，可以参考 `frameInputs` 思路，但按当前 `CanvasConnection` 和 `CanvasNodeMetadata` 重新设计。

## 持久化和导入导出对比

### 当前项目

当前项目：

- 画布项目通过 Zustand persist + localforage 保存。
- 项目包含节点、连线、聊天会话、activeChatId、背景模式、图片信息开关、视口。
- 媒体通过本地图片/文件存储服务保存。
- 导出时把 `projects.json` 和引用到的图片/视频文件一起打包成 zip。
- 导入时恢复媒体 blob，再插入画布项目。

优点：

- 不依赖后端。
- 对用户“另接后端”的计划更友好。
- 可作为本地草稿和离线能力。

缺点：

- 当前主要是本地，不是云同步。
- 多端同步需要另行设计。

### TwitCanva

TwitCanva：

- `useWorkflow` 保存到 `http://localhost:3001/api/workflows`。
- `WorkflowPanel` 读取自己的工作流后端。
- `HistoryPanel`、`AssetLibraryPanel` 等也倾向自己的服务。

优点：

- 有工作流面板和公开工作流概念。
- UI 上适合“作品/工作流管理”。

缺点：

- 后端绑定明显。
- 用户不用它后端时，保存/加载逻辑需要重写。

建议：

- 当前项目可以借鉴 WorkflowPanel 的 UI 概念。
- 不要搬 TwitCanva 的保存/加载实现。

## UI 和产品形态对比

### 当前项目

当前项目 UI 更像通用 AI 多媒体画布：

- 画布库页面。
- 顶栏简洁。
- 底部工具栏。
- 右下/左下缩放控件和小地图。
- 节点 hover toolbar。
- 配置节点内嵌生成控制。
- 画布助手侧栏。
- 素材选择弹窗。

适合：

- 图片、文本、视频、音频混合创作。
- 用节点和连线组织参考素材。
- 用户自己组装生成流程。

### TwitCanva

TwitCanva UI 更像短视频工作台：

- 左侧/侧边 toolbar。
- WorkflowPanel。
- HistoryPanel。
- AssetLibraryPanel。
- ChatPanel。
- Storyboard 生成弹窗。
- Storyboard video 弹窗。
- Image editor / Video editor。
- Twitter / TikTok 发布弹窗。

适合：

- 从故事到分镜。
- 从分镜图到视频。
- 素材历史复用。
- 社媒内容发布流程。

建议：

- 如果当前项目未来要强化视频工作流，可以从 TwitCanva 借鉴“storyboard -> 图片节点组 -> 批量视频节点”的交互。
- 不建议把当前项目画布 UI 改成 TwitCanva 样式。当前项目已有自己的主题和组件体系。

## 建议从 TwitCanva 借鉴的能力

优先级高：

- `useNodeManagement` 的节点管理拆分思路。
- `useNodeDragging` 的节点拖拽 hook 方向。
- `useConnectionDragging` 的连线交互 hook 方向。
- `useSelectionBox` 的框选 hook 方向。
- `useGeneration` 的生成逻辑独立 hook 方向。
- `useGroupManagement` 的节点分组、取消分组、排列、重命名。
- `SelectionBoundingBox` 的分组工具条和组内排序交互。

优先级中：

- `StoryboardGeneratorModal` 的故事/角色/场景生成流程。
- `StoryboardVideoModal` 的多场景批量生成视频流程。
- `ImageEditorModal` 的画笔、箭头、文字、裁剪、编辑历史。
- `VideoEditorModal` 的视频裁剪导出。
- `useVideoFrameExtraction` 的视频最后一帧提取。
- `frameInputs` 和 `lastFrame` 的视频链式生成思路。

优先级低：

- ChatPanel 拖入节点交互。
- HistoryPanel 视觉组织。
- AssetLibraryPanel 入口组织。
- WorkflowPanel 的公开/我的工作流 tab。

## 不建议从 TwitCanva 迁移的部分

不要迁移：

- `NodeData` 整体结构。
- `App.tsx` 总控结构。
- `NodeControls.tsx` 中大量模型硬编码。
- `http://localhost:3001` 工作流保存/加载逻辑。
- Twitter/TikTok 发布逻辑。
- 本地模型管理逻辑。
- face-api 人脸检测逻辑。
- 固定节点宽高命中算法。
- 直接依赖 `server/index.js` 的功能。

原因：

- 用户不用这两个项目后端。
- 当前项目已有自己的 API、素材、配置、主题和存储体系。
- 直接迁移会引入大量无关依赖和耦合。

## 当前项目下一步路线

推荐路线：

1. 继续以当前项目画布为主线。
2. 按 `docs/canvas-client-page-hooks-refactor.md` 拆 `canvas-client-page.tsx`。
3. 第一轮只拆低风险结构，不改行为。
4. 第二轮再考虑从 TwitCanva 借鉴分组/storyboard/视频链路。
5. 所有新功能都按当前项目数据结构重新设计，不直接搬 TwitCanva 数据结构。

建议拆分顺序：

1. `canvas-page-types.ts`
2. `canvas-page-utils.ts`
3. `use-latest-canvas-refs.ts`
4. `use-canvas-viewport.ts`
5. `use-canvas-history.ts`
6. `use-canvas-connections.ts`
7. `use-canvas-selection-drag.ts`
8. `use-canvas-clipboard.ts`
9. `use-canvas-keyboard-shortcuts.ts`
10. `use-canvas-file-nodes.ts`
11. `use-canvas-image-actions.ts`
12. `use-canvas-generation.ts`

## 如果要做分组功能

可以参考 TwitCanva：

- `hooks/useGroupManagement.ts`
- `components/canvas/SelectionBoundingBox.tsx`

但当前项目应这样设计：

- `CanvasNodeData` 可以在 `metadata` 或新增轻量字段记录 `groupId`，但要谨慎评估持久化格式。
- 分组选框必须基于当前项目真实 `node.position`、`node.width`、`node.height`。
- 分组排列应支持当前项目图片组、视频、音频、配置节点不同尺寸。
- 分组不应破坏现有 `CanvasConnection`。
- 分组操作应进入撤销/重做历史。

## 如果要做 storyboard 功能

可以参考 TwitCanva：

- `hooks/useStoryboardGenerator.ts`
- `components/modals/StoryboardGeneratorModal.tsx`
- `components/modals/StoryboardVideoModal.tsx`

当前项目建议设计：

- Storyboard 不是新的后端概念，而是前端创建一组文本/图片/配置/视频节点的快捷流程。
- 生成故事脚本后，创建多个文本节点或配置节点。
- 每个 scene 可以创建图片节点，并自动连到对应配置节点。
- 之后可批量创建视频节点，连接对应图片节点。
- Storyboard group 可以只是节点分组 metadata，不要引入独立大模型到根节点结构。

## 如果要做首尾帧/视频链式生成

可以参考 TwitCanva：

- `hooks/useGeneration.ts` 中的 `frameInputs`
- `utils/videoHelpers.ts`
- `hooks/useVideoFrameExtraction.ts`

当前项目建议设计：

- 视频节点 metadata 可增加：
  - `frameRole?: "start" | "end"`
  - `lastFrameStorageKey?: string`
  - `lastFrameUrl?: string`
- 更推荐通过连线和配置节点 prompt composer 表达输入顺序。
- 不要直接照搬 `parentIds`，当前项目已经有独立 `CanvasConnection`。
- 如果要抽帧，结果应写入当前项目媒体存储，不要只保留临时 URL。

## 如果要做图片编辑器增强

当前项目已有：

- 裁剪
- 切图
- 局部编辑 mask
- 放大
- 超分占位
- 换角度
- 反推提示词

TwitCanva 可参考：

- `components/modals/ImageEditorModal.tsx`
- `hooks/useImageEditorDrawing.ts`
- `hooks/useImageEditorArrows.ts`
- `hooks/useImageEditorText.ts`
- `hooks/useImageEditorHistory.ts`
- `hooks/useImageEditorSelection.ts`
- `hooks/useImageEditorCrop.ts`

当前项目建议：

- 不直接迁移整套 ImageEditorModal。
- 可以分功能吸收，例如箭头标注、文字标注、编辑历史。
- 生成后的结果仍按当前项目图片节点方式创建新节点并连线。
- 编辑器状态如果要持久化，放在图片节点 metadata 中，但要控制字段复杂度。

## 如果要做视频编辑器

TwitCanva 可参考：

- `components/modals/VideoEditorModal.tsx`
- `hooks/useVideoEditor.ts`

当前项目建议：

- 视频编辑应作为视频节点工具动作。
- 裁剪后的结果创建新视频节点并与原节点连线。
- 输出媒体写入当前项目 `file-storage`。
- 不要依赖 TwitCanva 的后端文件接口。

## 两个项目常用文件索引

### 当前项目必读

```text
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
web/src/app/(user)/canvas/types.ts
web/src/app/(user)/canvas/constants.ts
web/src/app/(user)/canvas/stores/use-canvas-store.ts
web/src/app/(user)/canvas/components/infinite-canvas.tsx
web/src/app/(user)/canvas/components/canvas-node.tsx
web/src/app/(user)/canvas/components/canvas-connections.tsx
web/src/app/(user)/canvas/components/canvas-toolbar.tsx
web/src/app/(user)/canvas/components/canvas-node-hover-toolbar.tsx
web/src/app/(user)/canvas/components/canvas-config-node-panel.tsx
web/src/app/(user)/canvas/components/canvas-node-generation.ts
web/src/app/(user)/canvas/utils/canvas-resource-references.ts
web/src/app/(user)/canvas/utils/canvas-node-size.ts
web/src/app/(user)/canvas/utils/canvas-image-data.ts
web/src/app/(user)/canvas/utils/canvas-export.ts
```

### TwitCanva 值得参考

```text
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/App.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/types.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/CanvasNode.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/NodeContent.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/NodeControls.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/ConnectionsLayer.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/canvas/SelectionBoundingBox.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useCanvasNavigation.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useNodeManagement.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useNodeDragging.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useConnectionDragging.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useSelectionBox.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useGroupManagement.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useGeneration.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useStoryboardGenerator.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useVideoFrameExtraction.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/ImageEditorModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/VideoEditorModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/StoryboardGeneratorModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/StoryboardVideoModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/utils/videoHelpers.ts
```

### TwitCanva 一般不要读，除非任务明确相关

```text
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/services/
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/TwitterPostModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/TikTokPostModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/components/modals/TikTokImportModal.tsx
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useTikTokImport.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useFaceDetection.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/hooks/useLocalModelNodeHandlers.ts
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src/services/localModelService.ts
```

## 开新窗口时的建议提示词

如果下次要继续当前项目画布开发，可以让新窗口先读：

```text
请先阅读：
1. /Users/a1/Desktop/infinite-canvas/AGENTS.md
2. /Users/a1/Desktop/infinite-canvas/docs/canvas-frontend-comparison-twitcanva.md
3. /Users/a1/Desktop/infinite-canvas/docs/canvas-client-page-hooks-refactor.md

然后只关注当前项目 web/src/app/(user)/canvas 的前端画布功能，不使用当前项目或 TwitCanva 的后端。
```

如果下次要借鉴 TwitCanva 的某个功能，可以补充：

```text
只借鉴 TwitCanva 的前端交互和结构思路，不要迁移它的后端接口、NodeData 整体结构、localhost:3001 workflow 保存逻辑、社媒发布和本地模型依赖。
```

## 最终建议

当前项目应作为主项目继续推进。

短期优先级：

1. 拆 `canvas-client-page.tsx`。
2. 稳定当前节点、连线、生成、素材、导入导出能力。
3. 不做大规模 UI 改版。

中期可以吸收 TwitCanva：

1. 节点分组和分组选框。
2. Storyboard 工作流。
3. 首尾帧和视频链式生成。
4. 图像编辑器增强。
5. 视频编辑器。

长期方向：

- 当前项目作为通用 AI 多媒体画布。
- TwitCanva 作为短视频工作流参考库。
- 所有新功能都应按当前项目数据结构、主题体系、素材体系、配置体系重新实现。
