# canvas-client-page.tsx Hooks 拆分交接文档

本文档用于新窗口继续执行画布前端重构任务。目标是把当前项目的 `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx` 拆成几组页面私有 hooks，并尽量保持现有功能行为不变。

## 背景

当前项目是 `infinite-canvas`，前端画布位于：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `web/src/app/(user)/canvas/components/`
- `web/src/app/(user)/canvas/stores/`
- `web/src/app/(user)/canvas/utils/`
- `web/src/app/(user)/canvas/types.ts`

用户明确要求只关注画布前端 canvas 功能。后端会使用另一个项目，不使用当前项目或 `TwitCanva-Video-Workflow` 的后端。

前一轮已经对比过当前项目和 `/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src` 的画布前端。结论是：

- 当前项目更适合作为长期主线，因为它的画布数据结构、真实节点尺寸、项目本地持久化、导入导出和现有技术栈更贴合当前仓库。
- `TwitCanva` 的视频工作流能力值得参考，例如 storyboard、分组、首尾帧、视频链路、图片编辑器，但不建议整体迁移。
- 当前项目最大痛点是 `canvas-client-page.tsx` 约 3000 行，状态、历史、拖拽、连线、生成、上传、弹窗、快捷键、节点工具全部集中在一个页面组件里。

下一步应该做的是“渐进式拆分”，不是重写画布。

## 项目约束

必须遵循 `AGENTS.md`：

- 使用中文交流和写文档。
- 先读现有代码，再改。
- 不要改无关文件，不要顺手重构。
- 写代码保持最少行数，优先沿用现有结构和写法。
- 页面私有 hook 放在对应页面目录下；只有多个页面真实复用的 hook 才放到外层 `hooks/`。
- 画布相关状态和组件放在 `web/src/app/(user)/canvas/` 内部。
- 不要为了“纯组件”层层透传过多 props；已经在全局 store 或 hook 中的状态需要时直接使用。
- 每次写完代码，不需要检查语法，不需要执行构建，用户会自己做。
- 不要改后端，除非用户明确要求。
- 不要改无关文档；本次如果只是重构前端结构、无可测试功能变化，一般不需要更新 `todo.mdx` / `pending-test.mdx`。如果实际行为有可测试变化，再补充到待测试。

## 当前核心文件现状

`canvas-client-page.tsx` 当前承担了以下职责：

- 页面挂载壳：`CanvasPage`、`CanvasRefreshShell`
- 连接空白处新建节点菜单：`ConnectionCreateMenu`
- 画布主页面：`InfiniteCanvasPage`
- 项目加载、恢复、保存、删除、重命名
- 节点、连线、聊天会话、主题、图片信息开关、视口状态
- 历史栈撤销/重做
- 画布尺寸、视口转换、缩放、重置视图
- 节点创建、删除、复制、粘贴、清空
- 节点拖拽、框选、多选
- 连线拖拽、吸附、创建、删除、右键菜单
- 文件上传、拖入、系统剪贴板读取
- 图片裁剪、切图、局部编辑、放大、换角度、反推提示词
- 图片/视频/音频/文本生成和重试
- 画布助手插入图片/文本
- 素材库插入
- 顶栏、底部工具栏、缩放控件、小地图、节点 hover toolbar、各类弹窗渲染
- 底部纯工具函数，例如 `imageMetadata`、`videoMetadata`、`buildGenerationConfig`、`resetInterruptedGeneration`、`hydrateCanvasImages`

文件里已有一些局部类型和常量：

- `CanvasClipboard`
- `PendingConnectionCreate`
- `ConnectionDropTarget`
- `CanvasHistoryEntry`
- `VIDEO_NODE_MAX_WIDTH`
- `VIDEO_NODE_MAX_HEIGHT`
- `CONNECTION_HANDLE_HIT_RADIUS`
- `CONNECTION_NODE_HIT_PADDING`
- `NODE_STATUS_LOADING`
- `NODE_STATUS_SUCCESS`
- `NODE_STATUS_ERROR`
- `IMAGE_PROMPT_REVERSE_PRESET`
- `createCanvasNode`

这些不一定都要保留在页面文件里。可以先抽到页面私有 util 文件。

## 拆分总目标

把 `InfiniteCanvasPage` 从“所有逻辑集中组件”改成“页面编排组件”：

- 页面组件保留路由、主题、主要 JSX 布局和跨模块组装。
- 状态读写和事件逻辑下沉到 hooks。
- 可复用纯函数下沉到页面私有工具文件或 `canvas/utils/`。
- 不改变 UI、交互、节点数据结构、持久化格式。
- 不引入新的大型状态管理方案。
- 不把页面私有状态塞进全局 Zustand store。

理想结果：

- `canvas-client-page.tsx` 仍然可以保留 JSX 和少量 glue code，但应明显少于当前规模。
- 每个 hook 只负责一个领域，并返回页面渲染所需的状态和动作。
- 生成相关逻辑可以稍后再拆，因为它风险最高。
- 第一轮重构应优先拆低风险模块，确保每一步都容易回退和审查。

## 推荐目录结构

推荐新增页面私有目录：

```text
web/src/app/(user)/canvas/[id]/hooks/
web/src/app/(user)/canvas/[id]/canvas-page-utils.ts
web/src/app/(user)/canvas/[id]/canvas-page-types.ts
```

建议先建这些文件：

```text
web/src/app/(user)/canvas/[id]/canvas-page-types.ts
web/src/app/(user)/canvas/[id]/canvas-page-utils.ts
web/src/app/(user)/canvas/[id]/hooks/use-latest-canvas-refs.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-project-state.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-history.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-viewport.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-connections.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-selection-drag.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-clipboard.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-keyboard-shortcuts.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-file-nodes.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-image-actions.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-generation.ts
```

注意：不一定一次性全部创建。建议分阶段创建，优先低风险。

## 第一轮建议拆分范围

第一轮目标不是把 3000 行一次清空，而是先抽走稳定、低风险、边界清晰的逻辑：

1. 类型、常量、纯函数
2. latest refs 同步
3. 项目加载和持久化
4. 历史栈
5. 视口和坐标换算
6. 连接逻辑
7. 框选和拖拽
8. 剪贴板和快捷键

生成逻辑、图片工具、素材插入、助手插入可以第二轮再拆，因为它们依赖节点、连线、资源解析、API、message、配置弹窗和文件存储，耦合更高。

## 建议状态归属表

### 页面仍可保留

这些可以暂时留在 `canvas-client-page.tsx`，直到其他模块拆完：

- `theme`
- `effectiveConfig`
- `isAiConfigReady`
- `openConfigDialog`
- `message`
- 所有 JSX 渲染
- `CanvasTopBar`、`MenuLabel`、`Shortcut` 等页面内小组件
- 弹窗 JSX 组合

### `useCanvasProjectState`

负责项目级数据：

- `nodes`
- `setNodes`
- `connections`
- `setConnections`
- `chatSessions`
- `setChatSessions`
- `activeChatId`
- `setActiveChatId`
- `backgroundMode`
- `setBackgroundMode`
- `showImageInfo`
- `setShowImageInfo`
- `projectLoaded`
- `currentProject`
- `createAndOpenProject`
- `deleteCurrentProject`
- `renameCurrentProject`
- `clearCanvas` 可以暂时不放进这里，因为它还涉及选择状态、弹窗状态和文件清理。

输入：

- `projectId`
- `router`
- `viewport`
- `setViewport`
- `viewportRef`
- `history` 相关回调或 refs
- `cleanupCanvasFiles`

风险：

- 加载项目时会调用 `hydrateCanvasImages(resetInterruptedGeneration(project.nodes))`。
- 加载聊天会话时会调用 `hydrateAssistantImages(project.chatSessions || [])`。
- 持久化时会调用 `updateProject(projectId, { nodes, connections, chatSessions, activeChatId, backgroundMode, showImageInfo })`。
- 视口保存目前是单独 500ms debounce。

建议第一版可以只抽“项目加载和保存 effect”，其他动作仍留页面中。

### `useLatestCanvasRefs`

负责维护常用 refs：

- `nodesRef`
- `connectionsRef`
- `selectedNodeIdsRef`
- `viewportRef`
- `connectingParamsRef`
- `connectionTargetNodeIdRef`
- `selectionBoxRef`
- `pendingConnectionCreateRef`

输入：

- 当前 state 值

返回：

- 对应 refs

注意：

- 当前代码用 `useLayoutEffect` 同步 refs。
- 拆出去后仍应使用 `useLayoutEffect`，因为拖拽、连线、键盘事件依赖最新值。

建议接口：

```ts
export function useLatestCanvasRefs({
    nodes,
    connections,
    selectedNodeIds,
    viewport,
    connectingParams,
    connectionTargetNodeId,
    selectionBox,
    pendingConnectionCreate,
}: UseLatestCanvasRefsParams) {
    // return refs
}
```

### `useCanvasHistory`

负责：

- `historyRef`
- `lastHistoryRef`
- `historyCommitTimerRef`
- `applyingHistoryRef`
- `historyPausedRef`
- `historyState`
- `createHistoryEntry`
- `applyHistory`
- `undoCanvas`
- `redoCanvas`
- 初始历史重置

输入：

- `nodesRef`
- `connectionsRef`
- `chatSessions`
- `activeChatId`
- `backgroundMode`
- `showImageInfo`
- state setters：`setNodes`、`setConnections`、`setChatSessions`、`setActiveChatId`、`setBackgroundMode`、`setShowImageInfo`
- selection/dialog reset callbacks 或简单 setters
- `projectLoaded`

需要保留的行为：

- 历史提交 debounce 为 180ms。
- 拖拽过程中通过 `historyPausedRef.current = true` 暂停历史提交。
- `applyHistory` 后要清空选择、连接选择、右键菜单。
- `historyRef.current.past` 最多保留 50 个左右，当前逻辑是 `slice(-49)` 再 push。

建议不要第一步就把 `clearCanvas` 放进 history hook。`clearCanvas` 同时涉及文件清理和多处弹窗关闭，先留页面。

### `useCanvasViewport`

负责：

- `containerRef` 可以由页面传入，也可以由 hook 创建。
- `size`
- `setSize`
- `viewport`
- `setViewport`
- `screenToCanvas`
- `getCanvasCenter`
- `resetViewport`
- `setZoomScale`
- 首次居中 `didInitialCenterRef`
- ResizeObserver

输入：

- 可选初始 viewport

返回：

- `containerRef`
- `viewport`
- `setViewport`
- `viewportRef` 如果不由 `useLatestCanvasRefs` 统一维护，则由这里返回
- `size`
- `screenToCanvas`
- `getCanvasCenter`
- `resetViewport`
- `setZoomScale`

注意：

- 当前 `InfiniteCanvas` 自己处理 wheel zoom 和 pan。
- `useCanvasViewport` 不要接管 `InfiniteCanvas` 内部 pan/wheel 逻辑，只维护 viewport state 和坐标函数。
- `setZoomScale` 当前按视口中心缩放，范围是 `0.05` 到 `5`。

### `useCanvasConnections`

负责：

- `connectingParams`
- `setConnecting`
- `connectionTargetNodeId`
- `pendingConnectionCreate`
- `setPendingConnectionCreate`
- `mouseWorld`
- `connectNodes`
- `createConnectedNode`
- `cancelPendingConnectionCreate`
- `getConnectionDropTarget`
- `handleConnectStart`
- `handleGlobalMouseMove` 中的连接部分
- `handleGlobalMouseUp` 中的连接部分
- `deleteConnection`

输入：

- `nodesRef`
- `connectionsRef`
- `viewportRef`
- `screenToCanvas`
- `message`
- `effectiveConfig`
- `setNodes`
- `setConnections`
- `setSelectedNodeIds`
- `setSelectedConnectionId`
- `setContextMenu`
- `setDialogNodeId`

需要保留的行为：

- 不允许配置节点之间连接。
- 已存在的连接不重复创建。
- 拖到已有但不可连接节点附近时不弹创建节点菜单。
- 拖到空白处时设置 `pendingConnectionCreate`，展示 `ConnectionCreateMenu`。
- 命中检测必须继续基于真实节点 `position/width/height`。

相关纯函数可留在 `canvas-page-utils.ts`：

- `getConnectionTargetAnchor`
- `normalizeConnection`
- `isHiddenBatchChild`
- `isHiddenBatchConnectionEndpoint`

### `useCanvasSelectionDrag`

负责：

- `selectedNodeIds`
- `setSelectedNodeIds`
- `selectedConnectionId`
- `setSelectedConnectionId`
- `hoveredNodeId`
- `setHoveredNodeId`
- `selectionBox`
- `setSelectionBox`
- `dragRef`
- `rafRef`
- `nodeDraggingRef`
- `isNodeDragging`
- `setIsNodeDragging`
- `handleCanvasMouseDown`
- `handleNodeMouseDown`
- `finishNodeDrag`
- `handleGlobalMouseMove` 中的拖拽部分
- `handleGlobalPointerMove` 中的框选部分
- `handleGlobalMouseUp` 中的拖拽结束和框选清理部分

输入：

- `nodesRef`
- `selectedNodeIdsRef`
- `viewportRef`
- `selectionBoxRef`
- `screenToCanvas`
- `setNodes`
- `setContextMenu`
- `setToolbarNodeId`
- `setDialogNodeId`
- `historyPausedRef`
- `cancelPendingConnectionCreate`

需要保留的行为：

- `cmd/ctrl + 背景左键` 才进入框选。
- 背景普通点击取消选择。
- `shift/cmd/ctrl + 节点点击` 多选/反选。
- 拖拽已选节点时，批量图片组的子图也跟随移动。
- 拖拽过程暂停历史记录，结束后恢复。
- requestAnimationFrame 用于拖拽更新。

拆分注意：

- 当前 `handleGlobalMouseMove` 同时处理节点拖拽和连线预览，拆分后页面可以组合两个 hook 的 handlers。
- 可以让两个 hook 都返回 `onWindowMouseMove`，页面 effect 中按顺序调用：

```ts
const handledDrag = selectionDragHandlers.handleWindowMouseMove(event);
if (!handledDrag) connectionHandlers.handleWindowMouseMove(event);
```

也可以保持一个页面级 `handleGlobalMouseMove` glue 函数，分别调用两个 hook 方法。

### `useCanvasClipboard`

负责：

- `clipboardRef`
- `copySelectedNodes`
- `pasteCopiedNodes`
- `createTextNodeFromClipboard`
- `pasteSystemClipboard`

输入：

- `nodesRef`
- `connectionsRef`
- `selectedNodeIdsRef`
- `getCanvasCenter`
- `createImageFileNode`
- `setNodes`
- `setConnections`
- `setSelectedNodeIds`
- `setSelectedConnectionId`
- `setContextMenu`
- `setDialogNodeId`
- `message`

需要保留的行为：

- 复制选中节点时只复制选中节点之间的连接。
- 粘贴时以当前画布中心对齐。
- 系统剪贴板优先读图片，图片不存在再读文本。
- 文本剪贴板会创建文本节点并打开对应节点。

风险：

- `navigator.clipboard.read()` 有浏览器权限限制；保留原逻辑即可。

### `useCanvasKeyboardShortcuts`

负责窗口级快捷键：

- 撤销：`cmd/ctrl + z`
- 重做：`cmd/ctrl + shift + z` 或 `cmd/ctrl + y`
- 全选：`cmd/ctrl + a`
- 复制：`cmd/ctrl + c`
- 粘贴：`cmd/ctrl + v`
- 删除：`Delete` / `Backspace`
- 退出：`Escape`

输入：

- `copySelectedNodes`
- `pasteCopiedNodes`
- `pasteSystemClipboard`
- `undoCanvas`
- `redoCanvas`
- `deleteNodes`
- `deleteConnection`
- `selectedConnectionId`
- refs 和 setters
- `setConnecting`

需要保留的过滤：

- 输入框、textarea、select、`contenteditable`、`[data-canvas-no-zoom]` 中不触发快捷键。

建议接口：

```ts
useCanvasKeyboardShortcuts({
    selectedNodeIdsRef,
    nodesRef,
    selectedConnectionId,
    copySelectedNodes,
    pasteCopiedNodes,
    pasteSystemClipboard,
    undoCanvas,
    redoCanvas,
    deleteNodes,
    deleteConnection,
    resetInteractionState,
});
```

其中 `resetInteractionState` 可以由页面或 `useCanvasSelectionDrag` 提供。

### `useCanvasFileNodes`

负责文件创建和上传目标：

- `imageInputRef`
- `uploadTargetRef`
- `createImageFileNode`
- `createVideoFileNode`
- `createAudioFileNode`
- `handleUploadRequest`
- `handleImageInputChange`
- `handleDrop`

输入：

- `getCanvasCenter`
- `setNodes`
- `setSelectedNodeIds`
- `setSelectedConnectionId`
- `setDialogNodeId`
- `message`

需要保留：

- 图片使用 `uploadImage`
- 视频/音频使用 `uploadMediaFile`
- 图片尺寸用 `fitNodeSize`
- 视频最大尺寸用 `VIDEO_NODE_MAX_WIDTH`、`VIDEO_NODE_MAX_HEIGHT`
- 上传到已有节点时，按文件类型替换节点类型、标题、尺寸和 metadata。

建议第二阶段拆，因为它和素材、剪贴板、节点替换耦合。

### `useCanvasImageActions`

负责图片节点工具动作：

- `downloadNodeImage`
- `saveNodeAsset`
- `createImageReversePromptNodes`
- `cropImageNode`
- `splitImageNode`
- `maskEditImageNode`
- `upscaleImageNode`
- `generateAngleNode`
- `handleFontSizeChange`
- `toggleNodeFreeResize`
- `toggleBatchExpanded`
- `setBatchPrimary`

输入很多，建议第二阶段拆：

- `nodesRef`
- `connectionsRef`
- `effectiveConfig`
- `addAsset`
- `message`
- `setNodes`
- `setConnections`
- `setSelectedNodeIds`
- `setDialogNodeId`
- `setCropNodeId`
- `setMaskEditNodeId`
- `setSplitNodeId`
- `setUpscaleNodeId`
- `setSuperResolveNodeId`
- `setAngleNodeId`

风险：

- 图片工具会创建子节点并连线。
- 图片组主图逻辑必须保留。
- 生成失败时要设置目标子节点状态。
- `saveNodeAsset` 同时支持图片、视频、文本。

### `useCanvasGeneration`

负责生成和重试：

- `handleGenerateNode`
- `handleRetryNode`
- `generateImageFromTextNode`
- `insertAssistantImage`
- `insertAssistantText`
- `pasteAssistantImage`

依赖：

- `effectiveConfig`
- `isAiConfigReady`
- `openConfigDialog`
- `message`
- `nodesRef`
- `connectionsRef`
- `setNodes`
- `setConnections`
- `setSelectedNodeIds`
- `setSelectedConnectionId`
- `setDialogNodeId`
- `setRunningNodeId`

风险最高，建议最后拆。

需要保留的关键行为：

- 配置节点可以生成图片、文本、视频、音频。
- 图片生成支持 `count`，多图时创建 batch root 和 batch child。
- 空图片节点生成时复用当前节点。
- 非空图片节点生成时在右侧创建新图片节点。
- 图生图/参考图时走 `requestEdit`，纯文生图走 `requestGeneration`。
- 每张图片单独请求，部分失败时提示“部分图片生成失败”。
- 视频生成走 `requestVideoGeneration`，再 `storeGeneratedVideo`。
- 音频生成走 `requestAudioGeneration`，再 `storeGeneratedAudio`。
- 文本生成走 `requestImageQuestion`，支持流式写入。
- 重试时要从已有 metadata 或上游连接恢复 prompt、配置和参考图。

建议拆分方式：

- 先把底部纯函数移到 `canvas-page-utils.ts`。
- 再把 `handleGenerateNode` 单独搬到 `use-canvas-generation.ts`。
- 保持函数体尽量不改，只改依赖注入。
- 最后再优化内部结构，避免第一步引入行为变化。

## 纯函数建议迁移

可以移到 `canvas-page-utils.ts`：

- `createCanvasNode`
- `imageExtension`
- `audioExtension`
- `imageMetadata`
- `videoMetadata`
- `audioMetadata`
- `buildImageGenerationMetadata`
- `buildAudioGenerationMetadata`
- `referenceUrl`
- `generationReferenceUrls`
- `resolveMetadataReferences`
- `hydrateCanvasImages`
- `hydrateAssistantImages`
- `getGenerationCount`
- `applyNodeConfigPatch`
- `getConnectionTargetAnchor`
- `normalizeConnection`
- `getInputSummary`
- `buildGenerationConfig`
- `resetInterruptedGeneration`
- `findRetrySourceNode`
- `sourceNodeReferenceImages`
- `isAudioFile`
- `isHiddenBatchChild`
- `isHiddenBatchConnectionEndpoint`
- `buildAngleLabel`
- `buildAnglePrompt`

注意：

- 这些函数并不都是真的“纯函数”。例如 `resolveMetadataReferences`、`hydrateCanvasImages`、`hydrateAssistantImages` 会调用存储服务。可以放在同一个 util，但命名上不要误导。
- `buildGenerationConfig` 依赖 `AiConfig` 和 `defaultConfig`。
- 如果 util 文件 import 太多，可以拆成：
  - `canvas-page-utils.ts`
  - `canvas-page-media.ts`
  - `canvas-page-generation-utils.ts`

第一轮为减少文件数量，可以先只建一个 `canvas-page-utils.ts`。

## 推荐迁移顺序

### 第 1 步：抽局部类型、常量、工具函数

新增：

- `canvas-page-types.ts`
- `canvas-page-utils.ts`

移动：

- `CanvasClipboard`
- `PendingConnectionCreate`
- `ConnectionDropTarget`
- `CanvasHistoryEntry`
- 常量
- 底部工具函数

页面内改为 import。

验收：

- `canvas-client-page.tsx` 顶部类型和底部工具函数减少。
- 没有行为变化。
- 不改 JSX。

### 第 2 步：抽 `useLatestCanvasRefs`

新增：

- `hooks/use-latest-canvas-refs.ts`

替换页面中的 refs 和两个 `useLayoutEffect`。

验收：

- 页面里不再手动写 `nodesRef.current = nodes` 这一组同步。
- 拖拽、连线、快捷键仍能拿到最新 state。

### 第 3 步：抽 `useCanvasViewport`

新增：

- `hooks/use-canvas-viewport.ts`

移动：

- `size`
- `setSize`
- `didInitialCenterRef`
- ResizeObserver
- `screenToCanvas`
- `getCanvasCenter`
- `resetViewport`
- `setZoomScale`

页面保留：

- `viewport` 和 `setViewport` 可由 hook 返回。
- `containerRef` 可以由 hook 返回，然后传给 `InfiniteCanvas`。

验收：

- 页面里视口相关逻辑明显减少。
- 缩放控件、小地图、拖入位置、粘贴位置仍使用同一套坐标换算。

### 第 4 步：抽 `useCanvasHistory`

新增：

- `hooks/use-canvas-history.ts`

移动：

- `historyRef`
- `lastHistoryRef`
- `historyCommitTimerRef`
- `applyingHistoryRef`
- `historyPausedRef`
- `historyState`
- `createHistoryEntry`
- 历史提交 effect
- `applyHistory`
- `undoCanvas`
- `redoCanvas`

页面需要拿到：

- `historyState`
- `undoCanvas`
- `redoCanvas`
- `historyPausedRef`
- `resetHistory` 或 `initializeHistory`
- `historySnapshotRefs` 用于文件清理时传给 `cleanupAssetImages`

难点：

- 项目加载时当前会直接设置 `historyRef.current` 和 `lastHistoryRef.current`。
- 删除节点/清理文件时 `cleanupCanvasFiles` 会用历史数据防止误删撤销需要的图片。

建议设计：

```ts
const history = useCanvasHistory({
    projectLoaded,
    nodes,
    connections,
    chatSessions,
    activeChatId,
    backgroundMode,
    showImageInfo,
    nodesRef,
    connectionsRef,
    setters,
    resetTransientState,
});
```

返回：

```ts
{
    historyState,
    historyRef,
    lastHistoryRef,
    historyPausedRef,
    applyingHistoryRef,
    resetHistory,
    undoCanvas,
    redoCanvas,
}
```

### 第 5 步：抽连接逻辑

新增：

- `hooks/use-canvas-connections.ts`

移动：

- `connectingParams`
- `connectionTargetNodeId`
- `pendingConnectionCreate`
- `mouseWorld`
- `setConnecting`
- `connectNodes`
- `createConnectedNode`
- `cancelPendingConnectionCreate`
- `getConnectionDropTarget`
- `handleConnectStart`
- `deleteConnection`

先不要移动全局 mouse event effect。页面可以先保留 effect，然后调用 hook 返回的方法。

验收：

- 拖连线到目标节点仍可连接。
- 拖连线到空白处仍弹创建节点菜单。
- 拖连线到不可连接节点附近不会误弹菜单。
- 右键连线仍可删除。

### 第 6 步：抽选择和拖拽

新增：

- `hooks/use-canvas-selection-drag.ts`

移动：

- `selectedNodeIds`
- `selectedConnectionId`
- `hoveredNodeId`
- `selectionBox`
- `dragRef`
- `rafRef`
- `nodeDraggingRef`
- `isNodeDragging`
- `handleCanvasMouseDown`
- `handleNodeMouseDown`
- `finishNodeDrag`
- `handleGlobalPointerMove` 中的框选逻辑
- `handleGlobalMouseMove` 中的节点拖拽逻辑

页面保留一个组合 effect：

```ts
useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
        if (selectionDrag.handleWindowMouseMove(event)) return;
        connections.handleWindowMouseMove(event);
    };

    const handleMouseUp = (event: MouseEvent) => {
        selectionDrag.handleWindowMouseUp(event);
        connections.handleWindowMouseUp(event);
    };
}, [...]);
```

注意：

- 当前 `handleGlobalMouseUp` 既结束节点拖拽，又处理连线落点。拆分时顺序不要反。
- 节点拖拽结束必须先 `finishNodeDrag`。
- 然后才能处理连接落点。

### 第 7 步：抽剪贴板和快捷键

新增：

- `hooks/use-canvas-clipboard.ts`
- `hooks/use-canvas-keyboard-shortcuts.ts`

移动：

- `clipboardRef`
- `copySelectedNodes`
- `pasteCopiedNodes`
- `createTextNodeFromClipboard`
- `pasteSystemClipboard`
- 快捷键 `useEffect`

验收：

- `cmd/ctrl + c/v/a/z/y`
- `Delete/Backspace`
- `Escape`
- 粘贴系统图片和文本
- 粘贴复制的多节点和节点间连接

### 第 8 步：抽文件节点

新增：

- `hooks/use-canvas-file-nodes.ts`

移动：

- `imageInputRef`
- `uploadTargetRef`
- `createImageFileNode`
- `createVideoFileNode`
- `createAudioFileNode`
- `handleUploadRequest`
- `handleImageInputChange`
- `handleDrop`

验收：

- 工具栏上传
- 拖入图片/视频/音频
- 替换已有图片/视频/音频节点
- 从剪贴板粘贴图片

### 第 9 步：抽图片工具动作

新增：

- `hooks/use-canvas-image-actions.ts`

移动：

- 下载
- 存素材
- 反推提示词
- 裁剪
- 切图
- 局部编辑
- 放大
- 换角度
- 字号调整
- 批量图片组展开/收起和主图设置

验收：

- hover toolbar 所有按钮仍正常。
- 图片工具创建的新节点位置、连线、metadata 不变。

### 第 10 步：抽生成逻辑

新增：

- `hooks/use-canvas-generation.ts`

移动：

- `runningNodeId`
- `handleGenerateNode`
- `handleRetryNode`
- `generateImageFromTextNode`
- `insertAssistantImage`
- `insertAssistantText`
- `pasteAssistantImage`

建议最后做，因为它最容易产生行为差异。

验收：

- 空图片节点生成。
- 文本节点生图。
- 配置节点生图、文本、视频、音频。
- 图生图参考。
- 多图生成部分失败。
- 生成失败重试。
- 刷新后恢复 loading -> error 的中断任务。

## 页面最终可能长这样

未来 `InfiniteCanvasPage` 结构可以大致变成：

```tsx
function InfiniteCanvasPage() {
    const { message } = App.useApp();
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const projectId = params.id;

    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const effectiveConfig = useEffectiveConfig();
    const isAiConfigReady = useConfigStore((state) => state.isAiConfigReady);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);

    const viewport = useCanvasViewport();
    const project = useCanvasProjectState({ projectId, router, viewport });
    const refs = useLatestCanvasRefs({ ...project.state, ...viewport.state, ...interaction.state });
    const history = useCanvasHistory({ ...project.state, refs });
    const connections = useCanvasConnections({ refs, ...project.actions, ...viewport.actions });
    const selection = useCanvasSelectionDrag({ refs, ...project.actions, ...connections.actions, historyPausedRef: history.historyPausedRef });
    const clipboard = useCanvasClipboard({ refs, ...project.actions, getCanvasCenter: viewport.getCanvasCenter });
    const files = useCanvasFileNodes({ ...project.actions, getCanvasCenter: viewport.getCanvasCenter });
    const imageActions = useCanvasImageActions({ refs, ...project.actions, effectiveConfig });
    const generation = useCanvasGeneration({ refs, ...project.actions, effectiveConfig, isAiConfigReady, openConfigDialog });

    useCanvasKeyboardShortcuts({ selection, clipboard, history, connections });

    return (
        // JSX 主要编排
    );
}
```

这只是方向示意，不要照抄成巨大参数对象。实际写法应按当前代码最少改动原则来。

## 重要行为清单

拆分过程中必须保护以下行为：

- 画布项目刷新后恢复节点、连线、聊天会话、主题、图片信息开关和视口。
- 刷新时 loading 状态节点会被 `resetInterruptedGeneration` 改为 error。
- 本地图片和媒体会通过 `hydrateCanvasImages` / `hydrateAssistantImages` 恢复 URL。
- 历史栈保存 nodes、connections、chatSessions、activeChatId、backgroundMode、showImageInfo。
- 删除节点时要同步删除相关连线。
- 删除 batch root 时要删除 child；删除 child 时要修正 root 的 `batchChildIds`、`primaryImageId`、展示图 metadata。
- 清空画布和删除节点时不能误删历史里仍可能撤销恢复的图片数据。
- 连接命中必须基于真实节点尺寸，不要改成固定宽高。
- 图片节点默认保持原始比例缩放；开启 `freeResize` 后才 object-fill。
- 视频节点缩放保持比例。
- 文字节点双击编辑、外部点击退出编辑。
- 文本节点和 prompt 输入里的 `@` 资源引用仍可工作。
- 配置节点统计上游文本、图片、视频、音频资源。
- 生成配置节点的“组装提示词”仍解析 `@[node:id]` token。
- 顶部菜单、底部工具栏、缩放控件、小地图、助手面板都不应因拆 hook 改变显示。

## 不建议做的事情

本次拆分不要做这些：

- 不要引入 React Flow、Konva、Fabric.js 等新画布库。
- 不要把画布页面状态迁移到全局 Zustand。
- 不要重写节点数据结构。
- 不要改导入导出格式。
- 不要改 API 请求协议。
- 不要把生成逻辑改成新的抽象 DSL。
- 不要同时做 UI 改版。
- 不要顺手修所有 lint 或格式问题。
- 不要照搬 `TwitCanva` 的 `NodeData` 或硬编码尺寸逻辑。
- 不要执行构建或测试，除非用户明确要求。

## 可参考 TwitCanva 的点

只参考思想，不整体迁移：

- `useNodeManagement`：节点创建、更新、删除可以独立。
- `useConnectionDragging`：连线拖拽可以作为独立交互域。
- `useSelectionBox`：框选可以拆成 hook，但当前项目应继续使用真实节点尺寸。
- `useGeneration`：生成逻辑可以单独 hook 化。
- `useGroupManagement`：后续如果做节点分组/storyboard，可以参考分组 API。
- `SelectionBoundingBox`：分组选框、排列按钮、创建视频入口可以作为产品交互参考。
- `StoryboardGeneratorModal`：未来可参考 storyboard 生成图片组/视频组。
- `ImageEditorModal`：画笔、箭头、文字、裁剪历史可作为图片编辑弹窗参考。

不要参考：

- 固定 `340/300/400` 节点尺寸命中。
- `http://localhost:3001` 写死后端接口。
- 把所有模型字段都塞进节点根级字段。
- 社媒发布、本地模型、face-api 等与当前目标无关的依赖。

## 具体文件改动建议

第一批最小改动：

```text
新增：
web/src/app/(user)/canvas/[id]/canvas-page-types.ts
web/src/app/(user)/canvas/[id]/canvas-page-utils.ts
web/src/app/(user)/canvas/[id]/hooks/use-latest-canvas-refs.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-viewport.ts

修改：
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

第二批：

```text
新增：
web/src/app/(user)/canvas/[id]/hooks/use-canvas-history.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-connections.ts

修改：
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

第三批：

```text
新增：
web/src/app/(user)/canvas/[id]/hooks/use-canvas-selection-drag.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-clipboard.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-keyboard-shortcuts.ts

修改：
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

第四批：

```text
新增：
web/src/app/(user)/canvas/[id]/hooks/use-canvas-file-nodes.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-image-actions.ts
web/src/app/(user)/canvas/[id]/hooks/use-canvas-generation.ts

修改：
web/src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

## 建议接口草案

### `canvas-page-types.ts`

```ts
import type { CanvasBackgroundMode } from "@/lib/canvas-theme";
import type { CanvasAssistantSession, CanvasConnection, CanvasNodeData, ConnectionHandle, Position } from "../types";

export type CanvasClipboard = {
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
};

export type PendingConnectionCreate = {
    connection: ConnectionHandle;
    position: Position;
};

export type ConnectionDropTarget = {
    nodeId: string | null;
    isNearNode: boolean;
};

export type CanvasHistoryEntry = Pick<CanvasClipboard, "nodes" | "connections"> & {
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
};
```

### `use-latest-canvas-refs.ts`

```ts
export function useLatestCanvasRefs(params: {
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    selectedNodeIds: Set<string>;
    viewport: ViewportTransform;
    connectingParams: ConnectionHandle | null;
    connectionTargetNodeId: string | null;
    selectionBox: SelectionBox | null;
    pendingConnectionCreate: PendingConnectionCreate | null;
}) {
    // refs + useLayoutEffect
}
```

### `use-canvas-viewport.ts`

```ts
export function useCanvasViewport() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, k: 1 });
    const [size, setSize] = useState({ width: 1200, height: 720 });

    return {
        containerRef,
        viewport,
        setViewport,
        size,
        screenToCanvas,
        getCanvasCenter,
        resetViewport,
        setZoomScale,
    };
}
```

### `use-canvas-history.ts`

```ts
export function useCanvasHistory(params: {
    projectLoaded: boolean;
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    nodesRef: React.RefObject<CanvasNodeData[]>;
    connectionsRef: React.RefObject<CanvasConnection[]>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNodeData[]>>;
    setConnections: React.Dispatch<React.SetStateAction<CanvasConnection[]>>;
    setChatSessions: React.Dispatch<React.SetStateAction<CanvasAssistantSession[]>>;
    setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
    setBackgroundMode: React.Dispatch<React.SetStateAction<CanvasBackgroundMode>>;
    setShowImageInfo: React.Dispatch<React.SetStateAction<boolean>>;
    resetTransientState: () => void;
}) {
    return {
        historyRef,
        lastHistoryRef,
        historyPausedRef,
        applyingHistoryRef,
        historyState,
        resetHistory,
        undoCanvas,
        redoCanvas,
    };
}
```

## 拆分过程中的依赖处理

当前页面里很多函数互相依赖。拆分时不要追求一次性完美，可以让 hook 参数稍多一点，先保证行为不变。

常见依赖关系：

- `deleteNodes` 依赖 `cleanupCanvasFiles`、`chatSessions`、`projectId`、多个 dialog setter。
- `clearCanvas` 依赖 `cleanupCanvasFiles`、`deselectCanvas`、多个 dialog setter。
- `handleGenerateNode` 依赖 `buildNodeGenerationContext`、`hydrateNodeGenerationContext`、`requestGeneration`、`requestEdit`、`requestVideoGeneration`、`requestAudioGeneration`、上传存储函数和多个 setter。
- `handleRetryNode` 依赖 `findRetrySourceNode`、`resolveMetadataReferences`、`sourceNodeReferenceImages`。
- `handleAssetInsert` 依赖素材类型、`insertAssistantImage`、`insertAssistantText`、`getCanvasCenter`。
- `CanvasNodeHoverToolbar` 需要大量动作函数，拆分后可以从不同 hook 汇总传入。

如果遇到循环依赖，优先把共享的纯函数下沉到 `canvas-page-utils.ts`，不要让 hook 互相 import。

## 推荐工作策略

每一步只做一种移动：

1. 先移动类型/工具函数，不改逻辑。
2. 再移动一个 hook，不改 JSX。
3. 再修改页面调用，不改业务。
4. 保存后人工检查 import 是否合理。
5. 不做格式化全仓库，只让现有格式保持可读。

不要在同一个提交里同时改生成逻辑和拖拽逻辑。生成逻辑是高风险区，应最后动。

## 手动回归清单

用户说不需要执行构建，但新窗口完成重构后，应该告诉用户建议手动验证以下流程：

- 新建画布、重命名、删除当前画布、返回画布库。
- 创建图片、文本、配置、视频、音频节点。
- 拖拽节点、多选节点、框选节点。
- 复制/粘贴单节点、多节点、带连线多节点。
- 删除节点、撤销、重做。
- 清空画布、撤销。
- 拖拽连线到节点、空白处新建节点、右键删除连线。
- 上传图片、视频、音频。
- 拖入图片、视频、音频文件。
- 从剪贴板粘贴图片和文本。
- 图片节点缩放保持比例，自由缩放切换。
- 文本节点双击编辑、`@` 引用选择。
- 配置节点统计上游资源并生成。
- 图片生成、图生图、多图生成、部分失败提示。
- 视频生成、音频生成、文本生成。
- 重试失败节点。
- 图片裁剪、切图、局部编辑、放大、换角度、反推提示词。
- 画布助手插入图片和文本。
- 素材库插入图片、视频、文本。
- 切换浅色/深色主题、网格样式、图片信息开关。
- 缩放控件、小地图、重置视图。
- 刷新页面后恢复节点、连线、视口、本地媒体。
- 导出画布 zip，再导入恢复媒体文件。

## 完成后的文档处理

如果只是内部重构，没有用户可见功能变化：

- 不需要更新 `docs/content/docs/overview/features.mdx`。
- 不需要更新 `docs/content/docs/progress/todo.mdx`。
- 不需要更新 `docs/content/docs/progress/pending-test.mdx`。

如果重构过程中顺便修了行为 bug 或改变了交互：

- 需要把可测试变更写进 `docs/content/docs/progress/pending-test.mdx`。
- 不要直接写进正式功能说明，等用户确认测试通过后再更新功能文档。

## 新窗口建议开场执行顺序

新窗口可以这样继续：

1. 读取 `AGENTS.md` 和本文档。
2. 打开 `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`。
3. 先抽 `canvas-page-types.ts` 和 `canvas-page-utils.ts`。
4. 抽 `use-latest-canvas-refs.ts`。
5. 抽 `use-canvas-viewport.ts`。
6. 停下来做一次人工代码审查，确认没有行为变化。
7. 再进入 history、connections、selection 拆分。

建议第一轮完成标准：

- `canvas-client-page.tsx` 少掉一批局部类型、常量、底部工具函数。
- refs 同步逻辑被 hook 接管。
- viewport 逻辑被 hook 接管。
- 页面渲染不改。
- 不动生成逻辑。

这样收益明显、风险可控，也为后续拆更复杂的生成和图片工具铺好路。
