# TwitCanva 交互逻辑参考清单

本文档梳理 `/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/src` 中可迁移到本项目的主要交互逻辑。重点记录用户操作、代码入口、状态变化和迁移注意事项，方便后续逐项移植。

## 总体入口

- 主应用入口：`src/App.tsx`
- 画布导航：`src/hooks/useCanvasNavigation.ts`
- 指针调度：`src/hooks/usePointerHandlers.ts`、`src/App.tsx`
- 节点拖拽和平移：`src/hooks/useNodeDragging.ts`
- 框选：`src/hooks/useSelectionBox.ts`
- 连线拖拽：`src/hooks/useConnectionDragging.ts`
- 节点创建/删除：`src/hooks/useNodeManagement.ts`
- 右键菜单：`src/hooks/useContextMenuHandlers.ts`、`src/components/ContextMenu.tsx`
- 分组：`src/hooks/useGroupManagement.ts`、`src/components/canvas/SelectionBoundingBox.tsx`
- 快捷键：`src/hooks/useKeyboardShortcuts.ts`
- 面板状态：`src/hooks/usePanelState.ts`
- 标题编辑：`src/hooks/useCanvasTitle.ts`、`src/components/TopBar.tsx`

## 画布导航

### 触控板双指移动画布

用户操作：

- 在触控板上双指上下/左右滑动。
- 普通鼠标滚轮也会走同一逻辑。

代码入口：

- `src/hooks/useCanvasNavigation.ts`
- `handleWheel(e, hoveredNode?)`

行为：

- 未按 `Ctrl` / `Cmd` 时，`wheel` 用于平移画布。
- 平移公式：

```ts
setViewport(prev => ({
  ...prev,
  x: prev.x - e.deltaX,
  y: prev.y - e.deltaY,
}));
```

迁移提示：

- 本项目当前 `InfiniteCanvas` 中 `wheel` 默认是缩放，需要改成普通 `wheel` 平移、`Ctrl/Cmd + wheel` 缩放，才能复刻该体验。
- 这不是 `touchstart/touchmove` 的双指触摸实现，而是基于浏览器 `wheel` 事件的触控板手势。

### Ctrl/Cmd + 滚轮缩放

用户操作：

- 按住 `Ctrl` 或 `Cmd` 后滚动鼠标滚轮/触控板。

代码入口：

- `src/hooks/useCanvasNavigation.ts`
- `handleWheel(e, hoveredNode?)`

行为：

- `const s = Math.exp(-e.deltaY * 0.001)` 计算缩放倍率。
- 缩放范围限制为 `0.1 ~ 2.0`。
- 默认以鼠标位置为缩放锚点。
- 如果鼠标悬停在节点上，会以节点中心为锚点缩放。
- 放大悬停节点时，会轻微向窗口中心拉近，避免节点越放越偏。

关键逻辑：

```ts
const newX = anchorX - (anchorX - viewport.x) * (newZoom / viewport.zoom);
const newY = anchorY - (anchorY - viewport.y) * (newZoom / viewport.zoom);
```

迁移提示：

- 本项目已有基于鼠标位置的缩放算法，可以只迁移“普通 wheel 改平移、Ctrl/Cmd wheel 才缩放”的触发规则。
- 悬停节点居中增强可以后续单独迁移，因为它依赖节点尺寸和 `hoveredNode` 状态。

### 缩放滑块

用户操作：

- 拖动画布底部的 Zoom range input。

代码入口：

- `src/hooks/useCanvasNavigation.ts`
- `handleSliderZoom`
- `src/App.tsx` 底部 Zoom Slider

行为：

- 使用窗口中心作为缩放锚点。
- 滑块范围 `0.1 ~ 2`，步进 `0.1`。

迁移提示：

- 本项目已经有 `CanvasZoomControls`，不需要照搬 UI；如要迁移体验，只需确认缩放时以视口中心为锚点。

### 阻止浏览器默认缩放

用户操作：

- `Ctrl/Cmd + wheel` 时浏览器默认可能会缩放页面。

代码入口：

- `src/App.tsx`
- `src/hooks/useCanvasEffects.ts`

行为：

- 给画布 DOM 绑定原生 `wheel` 监听。
- 仅在 `e.ctrlKey || e.metaKey` 时 `preventDefault()`。

迁移提示：

- 本项目已有 `wheel` 的 `passive: false` 阻止逻辑，但如果改为普通 wheel 平移，应继续确保不会触发页面滚动或浏览器缩放。

## 画布指针调度

### 事件处理优先级

代码入口：

- `src/App.tsx`
- `handleGlobalPointerMove`
- `handleGlobalPointerUp`
- `src/hooks/usePointerHandlers.ts`

移动时优先级：

1. 框选更新。
2. 节点拖拽。
3. 连线拖拽。
4. 画布平移。

抬起时优先级：

1. 结束框选并计算选中节点。
2. 完成连线拖拽。
3. 停止画布平移。
4. 停止节点拖拽。
5. 释放 pointer capture。

迁移提示：

- 这个优先级很重要，避免拖节点时触发平移、拖连线时触发框选。
- 本项目如果增加新交互，也建议维持同类优先级。

### 背景左键拖拽框选

用户操作：

- 在画布空白区域按下左键并拖动。

代码入口：

- `src/App.tsx`
- `handlePointerDown`
- `src/hooks/useSelectionBox.ts`

行为：

- 仅当事件目标 id 是 `canvas-background` 时触发。
- 开始框选时清空当前节点选择和选中的连线。
- 同时关闭 workflow、history、asset library 面板。
- 框选矩形用屏幕坐标绘制在未变换的 overlay 层。
- 松手时将框选区域转换为画布坐标，计算与节点矩形是否相交。

迁移提示：

- 源项目节点尺寸计算比较粗略，`useSelectionBox` 默认节点尺寸是 `340 x 300`。
- 如果迁移到本项目，应使用本项目真实节点尺寸，避免选区命中不准。

### 中键拖拽平移画布

用户操作：

- 在画布空白区域按下中键或非左键拖动。

代码入口：

- `src/App.tsx`
- `src/hooks/useNodeDragging.ts`
- `startPanning`、`updatePanning`、`endPanning`

行为：

- 开始时设置 `isPanning.current = true`。
- 移动时直接累加 `e.movementX`、`e.movementY` 到 viewport。

迁移提示：

- 本项目已有中键和空格拖拽平移，源项目没有空格平移。
- 如只迁移源项目双指移动，不需要改本项目 pointer 平移逻辑。

## 节点选择与拖拽

### 单选节点

用户操作：

- 点击节点。

代码入口：

- `src/App.tsx`
- `CanvasNode` 的 `onNodePointerDown`
- `src/hooks/useNodeDragging.ts`

行为：

- 未按 `Shift` 时，点击节点会只选中该节点。
- 选中单个节点时显示节点控制区。
- 按下后记录 `dragNodeRef.current = { id }`，进入拖拽态。

迁移提示：

- 源项目点击节点即进入拖拽准备态，实际移动由全局 pointer move 处理。

### Shift 多选节点

用户操作：

- 按住 `Shift` 点击节点。

代码入口：

- `src/App.tsx`
- `CanvasNode` 的 `onNodePointerDown`

行为：

- 如果节点已在选中列表中，则直接开始拖拽。
- 如果节点未选中，则追加到 `selectedNodeIds`，并开始拖拽。

迁移提示：

- 本项目如果已有框选多选，Shift 点击多选可以作为补充交互单独迁移。

### 拖拽节点

用户操作：

- 按住节点并拖动。

代码入口：

- `src/hooks/useNodeDragging.ts`
- `updateNodeDrag`

行为：

- 位移会按当前缩放反算到画布坐标。

```ts
const zoomAdjustedDx = e.movementX / viewport.zoom;
const zoomAdjustedDy = e.movementY / viewport.zoom;
```

- 如果拖拽的节点属于当前多选，则所有选中节点一起移动。
- 否则只移动当前节点。

迁移提示：

- 本项目已有节点拖拽时也应按缩放反算坐标，迁移时重点对比多选拖拽体验。

### 拖拽节点到聊天面板

用户操作：

- 拖拽有内容的节点到聊天面板区域。

代码入口：

- `src/hooks/usePanelState.ts`
- `handleNodeDragStart`、`handleNodeDragEnd`
- `src/components/ChatPanel.tsx`
- `src/components/canvas/NodeContent.tsx`

行为：

- 节点内容区开始拖拽时，如果节点有内容，则设置 `isDraggingNodeToChat = true`。
- ChatPanel 根据该状态显示拖拽高亮。
- ChatPanel 支持 `dragenter`、`dragleave`、`dragover`、`drop`，用于接收节点媒体作为聊天附件。

迁移提示：

- 这是聊天面板和画布节点之间的联动交互，迁移时需要同时看 chat store/session 设计。

## 连线交互

### 从连接点拖拽创建连线

用户操作：

- 按住节点左侧或右侧连接点拖出线，拖到另一个节点上松手。

代码入口：

- `src/components/canvas/NodeConnectors.tsx`
- `src/hooks/useConnectionDragging.ts`
- `handleConnectorPointerDown`
- `updateConnectionDrag`
- `completeConnectionDrag`

行为：

- 按下连接点时进入连线拖拽态，记录起点节点和连接点方向。
- 拖动时临时线终点跟随鼠标。
- 根据鼠标画布坐标检测悬停节点。
- 根据悬停位置在节点中线左/右侧判断目标侧。
- 拖到目标左侧：起点是 parent，目标是 child。
- 拖到目标右侧：目标是 parent，起点是 child。
- 防止重复 parent。

迁移提示：

- 源项目连线关系保存在子节点的 `parentIds` 中，不是单独 edges 表。
- 本项目已有独立 `connections` 时，迁移规则要转换为本项目连接数据结构。

### 短按连接点打开添加菜单

用户操作：

- 快速点击连接点，不拖到任何节点。

代码入口：

- `src/hooks/useConnectionDragging.ts`
- `completeConnectionDrag`
- `src/hooks/useContextMenuHandlers.ts`
- `handleAddNext`

行为：

- 如果拖拽持续时间小于 `200ms` 且没有悬停目标节点，则打开 `node-connector` 菜单。
- 菜单显示在窗口中心。
- 从菜单选择节点类型后，会在源节点左侧或右侧创建新节点并自动连线。

迁移提示：

- 本项目已有加号菜单时，可以只迁移“连接点短按打开菜单”的触发方式。

### 连线类型校验

代码入口：

- `src/hooks/useConnectionDragging.ts`
- `isValidConnection`

规则：

- `IMAGE -> IMAGE / VIDEO / IMAGE_EDITOR` 允许。
- `VIDEO -> VIDEO / VIDEO_EDITOR` 允许。
- `VIDEO -> IMAGE / IMAGE_EDITOR` 不允许。
- `TEXT -> IMAGE / VIDEO` 允许。
- `TEXT -> TEXT / IMAGE_EDITOR` 不允许。
- 任意节点连接到 `TEXT` 不允许。
- `AUDIO` 暂不支持连接。
- `IMAGE_EDITOR -> IMAGE / VIDEO / IMAGE_EDITOR` 允许。
- `VIDEO_EDITOR -> VIDEO` 允许。
- `VIDEO_EDITOR -> VIDEO_EDITOR` 不允许。

迁移提示：

- 这套校验是业务强相关逻辑，迁移时应对照本项目节点类型重新建表，不要直接复制。

### 点击连线选中和删除

用户操作：

- 点击连线。
- 按 `Delete` 或 `Backspace`。

代码入口：

- `src/hooks/useConnectionDragging.ts`
- `handleEdgeClick`
- `deleteSelectedConnection`
- `src/hooks/useKeyboardShortcuts.ts`

行为：

- 点击连线设置 `selectedConnection = { parentId, childId }`。
- 删除时从 child 节点的 `parentIds` 中移除 parent。

迁移提示：

- 本项目如果连接是独立对象，删除时应删除 connection 记录，而不是改节点 `parentIds`。

## 右键菜单与添加节点

### 双击空白画布添加节点

用户操作：

- 双击画布空白区域。

代码入口：

- `src/hooks/useContextMenuHandlers.ts`
- `handleDoubleClick`

行为：

- 仅当目标 id 是 `canvas-background` 时触发。
- 在鼠标位置打开 `add-nodes` 菜单。

迁移提示：

- 本项目已有单独迁移文档 `web/DOUBLE_CLICK_ADD_NODES_MIGRATION_PLAN.md`，后续可按该文档对齐。

### 右键空白画布打开全局菜单

用户操作：

- 右键画布空白区域。

代码入口：

- `src/hooks/useContextMenuHandlers.ts`
- `handleGlobalContextMenu`
- `src/components/ContextMenu.tsx`

行为：

- `preventDefault()` 阻止浏览器菜单。
- 打开 `global` 类型菜单。
- 菜单包含添加节点、上传、素材库、撤销/重做、粘贴等操作。

迁移提示：

- 本项目如已有 Ant Design Dropdown/ContextMenu，应迁移动作而不是照搬 UI。

### 右键节点打开节点菜单

用户操作：

- 右键节点。

代码入口：

- `src/hooks/useContextMenuHandlers.ts`
- `handleNodeContextMenu`
- `src/components/ContextMenu.tsx`

行为：

- 阻止事件冒泡到画布。
- 打开 `node-options` 菜单，记录 `sourceNodeId`。
- 支持复制、删除、创建素材等节点相关动作。

迁移提示：

- 如果本项目已有节点悬浮工具栏，应明确哪些动作放右键菜单，哪些保留在工具栏。

### Toolbar 添加按钮打开菜单

用户操作：

- 点击左侧 Toolbar 的添加按钮。

代码入口：

- `src/hooks/useContextMenuHandlers.ts`
- `handleToolbarAdd`
- `src/components/Toolbar.tsx`

行为：

- 根据按钮 DOM 位置，在按钮右侧打开全局添加菜单。

迁移提示：

- 本项目左侧菜单已有自己的布局，迁移时重点保留“添加菜单定位到按钮旁”的交互。

### 菜单选中类型后创建节点

用户操作：

- 在菜单中选择 Text / Image / Video / Image Editor / Video Editor / Local Model 等类型。

代码入口：

- `src/hooks/useNodeManagement.ts`
- `handleSelectTypeFromMenu`
- `addNode`

行为：

- 全局菜单：把屏幕坐标转换成画布坐标，在点击位置创建节点。
- 普通新节点会把位置左移 `170`、上移 `100`，让节点中心接近鼠标位置。
- 连接点菜单：
  - 右侧追加：新节点放在源节点右边，`parentIds = [sourceNodeId]`。
  - 左侧前置：新节点放在源节点左边，并把新节点加入源节点 `parentIds`。
- 创建后选中新节点。

迁移提示：

- 本项目节点尺寸不同，`170 / 100 / 340 / GAP 100` 这些常量应按本项目节点尺寸重新计算。

## 快捷键

### 撤销和重做

用户操作：

- `Ctrl + Z` 撤销。
- `Ctrl + Y` 或 `Ctrl + Shift + Z` 重做。

代码入口：

- `src/hooks/useKeyboardShortcuts.ts`
- `src/hooks/useHistory.ts`
- `src/App.tsx`

行为：

- 输入框或文本域聚焦时不触发快捷键。
- 拖拽过程中不写入历史，拖拽结束后才记录。
- 如果有节点处于 `LOADING`，App 中会跳过应用历史，避免打断生成状态。

迁移提示：

- macOS 常用 `Cmd`，源项目只判断 `ctrlKey`，迁移到本项目时建议同时支持 `metaKey`。

### 复制、粘贴、复制一份

用户操作：

- `Ctrl + C` 复制选中节点。
- `Ctrl + V` 粘贴。
- 右键菜单中可触发 duplicate。

代码入口：

- `src/hooks/useKeyboardShortcuts.ts`

行为：

- 复制保存到 hook 内部 `clipboardRef`，不是系统剪贴板。
- 粘贴偏移 `50px`。
- Duplicate 偏移 `20px`。
- 粘贴和复制一份都会生成新 id。
- 新节点会清空 `parentIds` 和 `groupId`。
- 粘贴/复制后选中新节点。

迁移提示：

- 本项目如果要跨刷新或跨页面复制，应改为全局 store 或浏览器剪贴板；如果只做当前画布临时复制，`ref` 就足够。

### 删除和 Escape

用户操作：

- `Delete` / `Backspace` 删除。
- `Escape` 取消选择。

代码入口：

- `src/hooks/useKeyboardShortcuts.ts`

行为：

- 优先删除选中节点。
- 如果没有选中节点但选中了连线，则删除连线。
- `Escape` 清空节点选择和框选状态。

迁移提示：

- 本项目有输入型节点和弹窗时，要继续避免输入焦点下误删。

## 分组与选择框

### 多选后显示选择外框

用户操作：

- 框选或 Shift 多选多个节点。

代码入口：

- `src/components/canvas/SelectionBoundingBox.tsx`

行为：

- 多选时计算所有选中节点的包围盒。
- 非分组时显示虚线边框和 Group 按钮。
- 分组时显示实线边框、半透明背景、组名和工具条。
- 工具条 UI 会按 `1 / viewport.zoom` 做反向缩放，最大 `1.5`。

迁移提示：

- 本项目已有 selection bounding box，可重点参考其反向缩放和组工具条。

### 创建分组

用户操作：

- 多选后点击 `Group`。

代码入口：

- `src/hooks/useGroupManagement.ts`
- `groupNodes`

行为：

- 创建 `NodeGroup`，默认 label 是 `New Group`。
- 给所有选中节点写入 `groupId`。

迁移提示：

- 本项目如果已有 `groups` 类型，应迁移交互而不是复用源项目数据结构。

### 取消分组

用户操作：

- 点击组工具条中的 `Ungroup`。

代码入口：

- `src/hooks/useGroupManagement.ts`
- `ungroupNodes`

行为：

- 删除 group。
- 清除相关节点上的 `groupId`。

迁移提示：

- 源项目还会自动清理少于 2 个节点的无效组。

### 拖拽分组外框移动整组

用户操作：

- 点击分组外框空白处并拖动。

代码入口：

- `src/App.tsx`
- `SelectionBoundingBox` 的 `onBoundingBoxPointerDown`
- `src/hooks/useNodeDragging.ts`

行为：

- 对已选中的多节点，使用任意一个节点作为拖拽起点。
- `updateNodeDrag` 发现拖拽节点在多选中后，移动全部选中节点。

迁移提示：

- 这套逻辑复用了普通节点拖拽，不需要给分组单独写移动算法。

### 重命名分组

用户操作：

- 双击组名。
- 输入后回车或失焦保存。
- 按 Escape 退出编辑。

代码入口：

- `src/components/canvas/SelectionBoundingBox.tsx`
- `src/hooks/useGroupManagement.ts`
- `renameGroup`

行为：

- 双击组名进入 input 编辑态。
- 空字符串不会保存。

迁移提示：

- 本项目文案要中文化，例如默认组名和按钮文案。

### 分组排序

用户操作：

- 点击组工具条中的 Sort，选择 Horizontal / Vertical / Grid。

代码入口：

- `src/components/canvas/SelectionBoundingBox.tsx`
- `src/hooks/useGroupManagement.ts`
- `sortGroupNodes`

行为：

- 按节点 title 中的数字排序。
- 水平排列间距 `500`。
- 垂直排列间距 `350`。
- 网格排列固定 3 列。
- 以当前组内最小 `x/y` 作为起点。

迁移提示：

- 排序规则和间距应按本项目节点尺寸调整。

### 故事板分组操作

用户操作：

- 故事板组上点击 `Edit Storyboard`。
- 点击 `Create Videos`。

代码入口：

- `src/components/canvas/SelectionBoundingBox.tsx`
- `src/App.tsx`
- `useStoryboardGenerator`
- `StoryboardVideoModal`

行为：

- 如果 group 有 `storyContext`，显示编辑故事板按钮。
- 创建视频时会读取组内图片节点，打开批量生成视频弹窗。

迁移提示：

- 这是故事板业务功能，不属于基础画布交互；如果迁移，应放在故事板功能迁移阶段。

## 节点内容区交互

### 文本节点快捷动作

用户操作：

- 在 Text 节点中选择写内容、文生图、文生视频。

代码入口：

- `src/components/canvas/NodeContent.tsx`
- `src/hooks/useTextNodeHandlers.ts`

行为：

- 写内容：把 Text 节点切到 `textMode: editing`。
- 文生视频：在右侧创建 Video 节点，`parentIds = [textNodeId]`，并把 Text 节点切到编辑态。
- 文生图：在右侧创建 Image 节点，`parentIds = [textNodeId]`，并把 Text 节点切到编辑态。

迁移提示：

- 本项目已有文本节点工作流文档 `web/TEXT_NODE_WORKFLOW_MIGRATION_PLAN.md`，可与本节对照。

### 图片节点快捷动作

用户操作：

- 在图片节点内容区选择 Image to Image、Image to Video、Change Angle。

代码入口：

- `src/components/canvas/NodeContent.tsx`
- `src/hooks/useImageNodeHandlers.ts`

行为：

- Image to Image：右侧创建新的 Image 节点，连接当前图片。
- Image to Video：右侧创建新的 Video 节点，连接当前图片。
- Change Angle：创建 `CAMERA_ANGLE` 节点，进入 loading，调用相机角度生成接口，成功后写入结果图。

迁移提示：

- 本项目已有图片节点工作流文档 `web/IMAGE_NODE_WORKFLOW_MIGRATION_PLAN.md`。
- Change Angle 依赖 `cameraAngleService`，迁移前要确认本项目后端/API 是否支持。

### 节点内容拖拽到聊天

用户操作：

- 拖拽节点里生成的图片或视频到聊天面板。

代码入口：

- `src/components/canvas/NodeContent.tsx`
- `src/hooks/usePanelState.ts`
- `src/components/ChatPanel.tsx`

行为：

- 内容元素可触发 drag。
- 有内容的节点开始 drag 时 ChatPanel 显示可投放状态。
- drop 后把媒体作为聊天附件。

迁移提示：

- 本项目若要迁移，需要和当前聊天窗口弹出化方案一起处理。

### 节点内滚动区域阻止画布缩放/平移

用户操作：

- 在节点里的 textarea、下拉菜单、内容区域滚动或点击。

代码入口：

- `src/components/canvas/NodeContent.tsx`
- `src/components/canvas/NodeControls.tsx`

行为：

- 对部分内部控件调用 `e.stopPropagation()`。
- `onWheel` 阻止滚轮冒泡到画布。
- `onPointerDown` 阻止节点内部按钮触发节点拖拽。

迁移提示：

- 本项目迁移 wheel 平移后，更需要确保节点内部滚动区域不会带动画布。

## 编辑弹窗交互

### 图片编辑器画布交互

代码入口：

- `src/components/modals/ImageEditorModal.tsx`
- `src/hooks/useImageEditorSelection.ts`
- `src/hooks/useImageEditorDrawing.ts`
- `src/hooks/useImageEditorCrop.ts`
- `src/hooks/useImageEditorText.ts`
- `src/hooks/useImageEditorHistory.ts`
- `src/hooks/useImageEditorArrows.ts`

主要行为：

- 支持选择工具、画笔工具、裁剪工具、文字工具。
- 选择工具支持 mouse down / move / up 拖拽选择和移动编辑元素。
- 画笔工具支持在 canvas 上绘制。
- 裁剪工具支持拖拽裁剪框和应用/取消。
- 文本工具支持点击画布添加文本。
- 箭头工具支持绘制箭头。
- 内部维护编辑器自己的历史记录。
- PromptBar 中模型、比例、分辨率下拉通过点击外部关闭。

迁移提示：

- 图片编辑器是一套相对独立的大功能，不建议和画布基础交互混在一次迁移。
- 如果只迁移画布交互，可以先跳过此部分。

### 视频编辑器时间轴交互

代码入口：

- `src/components/modals/VideoEditorModal.tsx`
- `src/hooks/useVideoEditor.ts`

主要行为：

- 视频 metadata 加载后读取时长。
- 支持播放/暂停、跳到开始、跳到结束。
- 时间轴支持拖拽 playhead。
- 支持拖拽 trim start 和 trim end。
- mouse up / mouse leave 结束时间轴拖拽。
- 导出裁剪结果后回写节点。

迁移提示：

- 该部分属于视频节点编辑能力，和基础画布导航无强耦合。

### 媒体全屏预览

用户操作：

- 点击节点上的 expand 按钮。
- 在预览弹窗中滚轮缩放或关闭。

代码入口：

- `src/hooks/usePanelState.ts`
- `handleExpandImage`
- `src/components/modals/ExpandedMediaModal.tsx`

行为：

- 打开全屏预览弹窗。
- 弹窗内部自处理滚轮缩放，不冒泡到画布。

迁移提示：

- 本项目已有媒体预览时，可以只复用“节点 expand -> 全屏弹窗”的入口。

## 面板和顶部栏

### Toolbar 工具面板互斥

用户操作：

- 点击 Workflows / Assets / History / Tools。

代码入口：

- `src/components/Toolbar.tsx`
- `src/hooks/usePanelState.ts`
- `src/hooks/useWorkflow.ts`
- `src/App.tsx`

行为：

- 打开 History 会关闭 Workflow、Asset Library、Chat。
- 打开 Asset Library 会关闭 Workflow、History、Chat。
- 打开 Workflow 会关闭 History 和 Asset Library。
- 打开 Tools 下拉会关闭 Workflow、History、Asset Library。
- 打开面板时记录按钮纵向位置，用于设置浮层 top。

迁移提示：

- 本项目如果左侧菜单已经固定，重点迁移“面板互斥”和“按钮附近定位”。

### 工作流面板

用户操作：

- 打开 workflow 列表、切换 My/Public、加载 workflow、删除 workflow、编辑封面。

代码入口：

- `src/components/WorkflowPanel.tsx`
- `src/hooks/useWorkflow.ts`

行为：

- 列表项点击加载 workflow。
- 删除有确认态。
- 编辑封面时可从历史素材选择。
- 加载 workflow 会同步 nodes、groups、viewport、title。

迁移提示：

- 该功能与本项目项目列表/本地持久化模型不同，迁移前需要先对齐数据结构。

### 历史面板

用户操作：

- 打开历史面板，选择图片/视频素材。

代码入口：

- `src/components/HistoryPanel.tsx`
- `src/App.tsx`
- `handleSelectAsset`

行为：

- 选中素材后在当前画布视口中心创建节点。
- 图片会检测自然尺寸并映射到最近标准比例。
- 视频会读取 metadata，并只映射到 `16:9` 或 `9:16`。
- 创建后关闭 History 和 Asset Library。

迁移提示：

- 本项目素材如果来自本地 localforage，应把“选中素材后放到视口中心”的交互迁移到当前素材库。

### 素材库面板

用户操作：

- 打开素材库、切换分类、点击素材插入、删除素材。

代码入口：

- `src/components/AssetLibraryPanel.tsx`
- `src/hooks/useAssetHandlers.ts`

行为：

- 支持 panel 和 modal 两种展示模式。
- 从右键菜单打开时使用 modal variant。
- 点击背景关闭。
- 删除素材有二次确认覆盖层。

迁移提示：

- 本项目已有“我的素材”，迁移时应重点参考面板和画布插入交互，而不是存储实现。

### Chat 面板

用户操作：

- 点击 ChatBubble 打开/关闭聊天。
- 拖入节点媒体作为附件。
- 打开历史会话、新建会话、删除会话、发送消息、复制消息。

代码入口：

- `src/components/ChatPanel.tsx`
- `src/hooks/useChatAgent.ts`
- `src/components/ChatMessage.tsx`

行为：

- ChatBubble 固定显示，点击切换面板。
- ChatPanel 支持历史会话列表。
- drop 节点媒体后加入 attachment。
- 消息气泡支持复制。

迁移提示：

- 本项目已有聊天窗口弹出迁移主文档 `web/CHAT_WINDOW_POPUP_MIGRATION_PLAN.md`，这部分以该文档为准。

### 顶部栏标题编辑

用户操作：

- 双击标题进入编辑。
- 保存、新建、切换主题。
- 新建时如果有未保存更改，出现确认弹窗。

代码入口：

- `src/hooks/useCanvasTitle.ts`
- `src/components/TopBar.tsx`
- `src/App.tsx`

行为：

- 进入编辑态后自动 focus 并 select。
- 新建画布会清空 nodes/groups/selection，并重置 workflow id。
- 切换主题在 `dark` 和 `light` 间切换。

迁移提示：

- 本项目已经有项目标题和主题系统，迁移时只参考“标题双击编辑”和“未保存新建确认”。

## 导入、发布和生成类交互

### TikTok 导入

用户操作：

- 点击 Toolbar 中 TikTok 工具，打开导入弹窗。
- 导入视频后在当前视口中心创建节点。

代码入口：

- `src/hooks/useTikTokImport.ts`
- `src/components/modals/TikTokImportModal.tsx`

行为：

- 弹窗遮罩点击关闭。
- 导入成功后根据 viewport 在画布中心落节点。

迁移提示：

- 这是外部平台业务功能，非基础画布交互。

### Storyboard 生成

用户操作：

- 点击 Storyboard 工具打开多步弹窗。
- 生成脚本、选择角色、生成 composite、创建 storyboard 节点。

代码入口：

- `src/hooks/useStoryboardGenerator.ts`
- `src/components/modals/StoryboardGeneratorModal.tsx`
- `src/App.tsx`

行为：

- 创建多个 Image 节点。
- 可自动创建 group，并保存 `storyContext`。
- 创建后自动按间隔触发每个节点生成。

迁移提示：

- 这部分依赖本项目生成队列和批量节点布局，建议作为单独故事板功能迁移。

### Storyboard 批量视频

用户操作：

- 在 storyboard 分组上点击 `Create Videos`。
- 弹窗里为每个场景生成/优化 prompt，选择模型和参数，然后批量创建视频节点。

代码入口：

- `src/components/modals/StoryboardVideoModal.tsx`
- `src/App.tsx`
- `handleCreateStoryboardVideo`
- `handleGenerateStoryVideos`

行为：

- 只接受 Image 节点作为来源。
- 新视频节点整体放到 storyboard 组右侧。
- 保持源节点相对布局。
- 批量生成时 stagger 调用，避免同时打满接口。

迁移提示：

- 可复用“按组右侧整体生成新节点”的布局思路。

### 发布到 X / TikTok

用户操作：

- 在节点中点击发布按钮，打开 X 或 TikTok 发布弹窗。

代码入口：

- `src/App.tsx`
- `TwitterPostModal`
- `TikTokPostModal`

行为：

- 记录待发布媒体 URL 和类型。
- X 弹窗监听 `window.message` 处理登录/授权状态。

迁移提示：

- 属于平台发布业务，不属于基础画布交互。

## 自动保存和恢复类交互

### 脏状态和手动保存

代码入口：

- `src/App.tsx`
- `src/hooks/useWorkflow.ts`
- `src/hooks/useAutoSave.ts`

行为：

- nodes 或 canvasTitle 变化后标记 dirty。
- 新节点进入 `LOADING` 时立即触发一次保存，保护生成恢复。
- 自动保存间隔 60 秒。
- 保存成功后清除 dirty。

迁移提示：

- 本项目目前主要使用浏览器本地存储，自动保存逻辑应对齐当前 store persistence，不要照搬 workflow API。

### 生成恢复

代码入口：

- `src/hooks/useGenerationRecovery.ts`
- `src/hooks/useVideoFrameExtraction.ts`

行为：

- 生成中的节点恢复状态。
- 视频节点缺少 lastFrame 时自动提取最后一帧。

迁移提示：

- 这属于生成任务恢复，不是单纯 UI 交互；迁移前需要确认本项目任务状态模型。

## 可优先迁移清单

建议按以下顺序拆分迁移，降低互相影响：

1. 触控板双指平移：普通 `wheel` 平移，`Ctrl/Cmd + wheel` 缩放。
2. 节点内部滚轮/指针事件隔离：避免节点 textarea、下拉、弹窗滚动带动画布。
3. Shift 点击多选和多选拖拽：补齐节点选择体验。
4. 连线短按打开添加菜单：复用本项目现有添加节点菜单。
5. 连接类型校验：按本项目节点类型重新映射。
6. 分组外框工具条：Group/Ungroup/Sort/Rename。
7. 拖拽节点到聊天面板：和聊天窗口迁移合并处理。
8. 历史/素材选择后插入视口中心：和“我的素材”交互合并处理。

## 不建议直接复制的部分

- 节点尺寸常量：源项目大量使用 `340 / 365 / 385 / 500 / GAP 100`，本项目节点尺寸不同。
- 连线数据结构：源项目用子节点 `parentIds` 表示连接，本项目若使用独立 connections，应转换。
- 快捷键只支持 `Ctrl`：本项目面向 macOS 使用时应同时支持 `Cmd`。
- 业务 API：Change Angle、TikTok、X、Storyboard、Workflow 保存都依赖源项目服务，不应作为基础交互直接复制。
- 图片编辑器和视频编辑器：功能较大，应作为独立模块迁移。

## 对比本项目后的差异与迁移计划

以下内容基于本项目 `web/src/app/(user)/canvas/` 当前实现整理，只列与本项目不同或缺失的交互；本项目已经具备的框选、多选拖拽、基础分组、连线选中/删除、复制粘贴、标题双击编辑、素材插入视口中心等能力不再重复记录。

### 简单合并迁移包

#### 画布滚轮导航体验

差异：

- TwitCanva 普通滚轮/触控板双指用于平移画布。
- TwitCanva 仅在 `Ctrl/Cmd + wheel` 时缩放。
- 本项目当前 `wheel` 无条件缩放，平移主要靠中键或空格拖拽。

本项目入口：

- `web/src/app/(user)/canvas/components/infinite-canvas.tsx`

迁移计划：

- 修改 `InfiniteCanvas.handleWheel`。
- 无 `ctrlKey/metaKey` 时执行平移：`x -= deltaX`、`y -= deltaY`、`k` 不变。
- 有 `ctrlKey/metaKey` 时保留本项目当前鼠标锚点缩放算法。
- 缩放范围建议继续沿用本项目 `0.05 ~ 5`，不要直接改成 TwitCanva 的 `0.1 ~ 2`，避免影响当前大画布使用习惯。
- 同步更新快捷键弹窗文案：从“滚轮缩放画布”改成“滚轮/双指平移，Ctrl/Cmd + 滚轮缩放”。

#### 滚轮和指针事件隔离补强

差异：

- TwitCanva 更强调节点内部滚动、下拉、弹窗、媒体预览不带动画布。
- 本项目已有 `data-canvas-no-zoom` 和部分 `onWheel.stopPropagation`，但普通滚轮改成平移后，隔离面需要更严格。

本项目入口：

- `web/src/app/(user)/canvas/components/infinite-canvas.tsx`
- `web/src/app/(user)/canvas/components/canvas-node.tsx`
- 画布内各类弹窗和浮层组件。

迁移计划：

- 在文本域、视频/audio controls、节点弹层、Ant Design 下拉、节点内部可滚区域统一补 `data-canvas-no-zoom` 或 `onWheel.stopPropagation()`。
- 保留 `InfiniteCanvas` 中对 `.ant-modal`、`.ant-popover`、`.ant-dropdown` 等选择器的排除逻辑，并按新增浮层补齐。
- 这项应和“画布滚轮导航体验”一起完成。

#### 右键空白画布全局菜单

差异：

- TwitCanva 右键空白画布会打开全局菜单，包含添加节点、上传、素材库、撤销/重做、粘贴等动作。
- 本项目当前右键空白画布只阻止浏览器菜单并关闭已有菜单。

本项目入口：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `web/src/app/(user)/canvas/components/canvas-context-menu.tsx`
- `web/src/app/(user)/canvas/types.ts`

迁移计划：

- 扩展 `ContextMenuState`，增加 `{ type: "canvas", x, y, position }`。
- 在空白画布右键时记录屏幕坐标和画布坐标，并打开 canvas 类型菜单。
- 复用本项目已有动作：`createNode`、`handleUploadRequest`、`setAssetPickerOpen`、`undoCanvas`、`redoCanvas`、`pasteCopiedNodes/pasteSystemClipboard`。
- 扩展 `CanvasNodeContextMenu` 或重命名为更通用的 `CanvasContextMenu`，按 `menu.type === "canvas"` 渲染全局菜单。
- 菜单文案全部使用中文。

#### 节点右键菜单动作补齐和中文化

差异：

- TwitCanva 节点菜单包含复制、删除、创建素材等节点动作。
- 本项目节点右键菜单目前主要是 `Duplicate` / `Delete`，且文案仍是英文。

本项目入口：

- `web/src/app/(user)/canvas/components/canvas-context-menu.tsx`
- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`

迁移计划：

- 把 `Duplicate` / `Delete` 改成“复制一份”/“删除”。
- 增加“复制节点”，接入 `copySelectedNodes`。
- 增加“保存到我的素材”，复用现有 `saveNodeAsset`。
- 连接菜单保持“删除连线”，不要套用节点动作。
- 这项适合和“右键空白画布全局菜单”合并开发。

#### 连接点短按添加节点细节对齐

差异：

- TwitCanva 短按连接点小于 `200ms` 且没有目标节点时打开添加菜单。
- TwitCanva 从连接点创建新节点时，会按连接点方向把新节点放在源节点左侧或右侧。
- 本项目已有“连线拖空后弹出创建菜单”，但没有短按阈值，且新节点创建在释放位置。

本项目入口：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `ConnectionCreateMenu`
- `createConnectedNode`

迁移计划：

- 在 `handleConnectStart` 记录开始时间和起点坐标。
- `handleGlobalMouseUp` 判断持续时间和移动距离：短按走“连接点添加菜单”，拖拽空放继续沿用当前行为。
- `createConnectedNode` 增加从连接点创建时的布局分支：
  - `source` 侧创建：新节点放在源节点右侧。
  - `target` 侧创建：新节点放在源节点左侧。
- 间距按本项目节点尺寸计算，例如使用源节点宽度、新节点宽度和当前画布间距常量，不复制 TwitCanva 的固定 `340 / GAP 100`。
- 继续使用本项目独立 `connections` 数据结构，不引入 TwitCanva 的 `parentIds` 模型。

#### 分组工具条文案中文化

差异：

- 本项目分组交互基本已经具备。
- 但默认组名和按钮文案仍包含 `New Group`、`Group`、`Sort`、`Horizontal`、`Vertical`、`Grid`、`Ungroup`。

本项目入口：

- `web/src/app/(user)/canvas/components/canvas-selection-bounding-box.tsx`
- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`

迁移计划：

- 默认组名改为“新分组”。
- 按钮文案改为“分组”“排序”“横向”“纵向”“网格”“取消分组”。
- 只改文案，不调整现有分组数据结构和排序算法。

#### 媒体预览弹窗缩放

差异：

- TwitCanva 全屏媒体预览支持弹窗内部滚轮缩放。
- 本项目图片详情弹窗目前主要是静态 `img` 展示。

本项目入口：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`

迁移计划：

- 给图片详情 Modal 内部增加局部 `zoom` 状态。
- 弹窗内容 `onWheel` 自处理缩放，并调用 `stopPropagation/preventDefault`，避免影响画布滚轮平移或缩放。
- 可先只做图片预览缩放，视频预览仍保留浏览器 controls。

### 中等难度迁移项

#### 连接类型校验矩阵

差异：

- TwitCanva 有详细的节点类型连接规则。
- 本项目当前 `normalizeConnection` 主要只禁止配置节点互连，其余连接基本允许。

本项目入口：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `normalizeConnection`
- `CanvasNodeType`

迁移计划：

- 新增本项目自己的 `isValidCanvasConnection(fromType, toType)`。
- 不直接复制 TwitCanva 规则，应按本项目节点类型重新确认：
  - `Text`
  - `Image`
  - `Video`
  - `Audio`
  - `Config`
  - `ImageEditor`
  - `VideoEditor`
  - `Storyboard`
  - `CameraAngle`
  - `LocalImageModel`
  - `LocalVideoModel`
- 先保持 `Config -> 任意生成节点` 的现有能力，因为它已经参与本项目生成上下文。
- 非法连接时给出明确中文提示，不再统一提示“配置节点之间不能连接”。

#### 节点内容拖拽到聊天助手作为附件

差异：

- TwitCanva 可以把节点图片/视频拖入 ChatPanel 作为附件。
- 本项目助手引用主要来自选中节点；节点图片当前显式 `draggable={false}`。

本项目入口：

- `web/src/app/(user)/canvas/components/canvas-node.tsx`
- `web/src/app/(user)/canvas/components/canvas-assistant-panel.tsx`
- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`

迁移计划：

- 轻量版：
  - 节点内容开始拖拽时写入 `dataTransfer` 的 `nodeId`。
  - 助手面板 drop 后把该 `nodeId` 加入 `selectedNodeIds`。
  - 复用现有助手引用 chips。
- 完整版：
  - 给 `CanvasAssistantPanel` 增加独立附件状态。
  - 拖入附件不改变画布选择，只影响当前聊天输入。
- 建议和 `web/CHAT_WINDOW_POPUP_MIGRATION_PLAN.md` 合并设计，避免聊天窗口弹出化后再次改状态结构。

#### 素材库 panel 形态和面板互斥

差异：

- TwitCanva 的素材、历史、工作流面板有互斥规则，点击不同工具会关闭其他面板。
- 本项目目前主要使用 `AssetPickerModal`，助手侧栏可以同时存在。

本项目入口：

- `web/src/app/(user)/canvas/components/asset-picker-modal.tsx`
- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `CanvasLeftMenu`
- `CanvasToolbar`

迁移计划：

- 如果要复刻 TwitCanva：新增素材侧栏或浮层 variant，并定义打开素材时是否收起助手。
- 如果保留本项目当前风格：只需要保留“从素材选择后插入视口中心”的行为；本项目已具备，无需重复迁移。
- 这项涉及画布布局和助手侧栏关系，建议单独开任务确认。

#### 粘贴落点策略

差异：

- TwitCanva 复制后粘贴使用固定偏移。
- 本项目粘贴会把复制内容整体放到当前视口中心。

本项目入口：

- `web/src/app/(user)/canvas/[id]/canvas-client-page.tsx`
- `pasteCopiedNodes`
- `duplicateNode`

迁移建议：

- 不建议直接替换为 TwitCanva 的固定偏移。
- 视口中心更符合本项目当前无限画布体验。
- 可以保留两种语义：
  - “复制一份”继续使用偏移。
  - “粘贴”继续使用视口中心。

### 困难迁移项

#### 完整图片编辑器

差异：

- TwitCanva 图片编辑器包含选择、画笔、裁剪、文字、箭头和独立历史。
- 本项目已有裁剪、蒙版、拆分、放大、角度等单点弹窗，但不是完整编辑器。

迁移计划：

- 作为独立“图片编辑器”模块迁移。
- 不和基础画布导航、右键菜单、分组等交互混在一次开发。
- 需要先确定编辑结果如何回写节点、如何保存历史、如何和当前图片节点工具栏合并。

#### 视频编辑器时间轴

差异：

- TwitCanva 有播放头、trim start/end、导出裁剪结果回写节点。
- 本项目视频节点目前以生成和展示为主。

迁移计划：

- 单独设计视频编辑状态、时间轴 UI、导出处理和文件存储策略。
- 不建议作为基础画布交互的一部分直接移植。

#### Storyboard 生成和 Storyboard 分组操作

差异：

- TwitCanva 的 Storyboard 包含多步生成、角色/场景、自动建组、组内批量生成视频。
- 本项目虽然有 `Storyboard` 节点类型，但当前还不是完整故事板工作流。

迁移计划：

- 作为独立“故事板功能”迁移。
- 先定义本项目 `storyContext` 数据结构。
- 再接入分组工具条中的故事板专用按钮，例如“编辑故事板”“创建视频”。
- 可复用 TwitCanva “按组右侧整体生成新节点”的布局思路。

#### Workflow 面板、远端保存、脏状态和自动保存

差异：

- TwitCanva 的 Workflow 是远端工作流模型。
- 本项目当前是浏览器本地项目和 localforage 持久化。

迁移计划：

- 不直接迁移 TwitCanva 的 workflow API、dirty/manual save、60 秒 autosave。
- 只有当本项目决定引入云端画布或远端工作流后，再重新设计保存模型。
- 当前阶段以本项目已有本地持久化为准。

#### 生成恢复和视频最后帧提取

差异：

- TwitCanva 会恢复生成中节点，并为视频补 last frame。
- 本项目当前刷新后会把 loading 标成失败，提示用户重新生成。

迁移计划：

- 先统一生成任务 ID、轮询/恢复协议、视频 metadata 补全策略。
- 再实现刷新后的任务恢复。
- 这属于生成系统任务，不是普通 UI 交互迁移。

#### TikTok 导入、X/TikTok 发布

差异：

- TwitCanva 集成 TikTok 导入、X/TikTok 发布。
- 本项目当前没有对应平台授权和发布模型。

迁移计划：

- 作为后续平台集成阶段处理。
- 不放进基础画布交互迁移。

### 推荐迁移顺序

第一批：

1. 画布滚轮导航体验。
2. 滚轮和指针事件隔离补强。
3. 快捷键文案调整。
4. 右键菜单中文化和动作补齐。
5. 连接点短按添加节点的布局对齐。

第二批：

1. 连接类型校验矩阵。
2. 节点内容拖拽到聊天助手作为附件。

第三批：

1. 完整图片编辑器。
2. 视频编辑器时间轴。
3. Storyboard 生成和批量视频。
4. Workflow/远端保存。
5. 生成恢复。
6. 平台导入和发布。
