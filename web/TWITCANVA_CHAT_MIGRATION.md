# TwitCanva Chat 功能移植文档

本文档用于把 `/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow` 中“点击右下角浮动按钮弹出 Chat 对话框”的功能，完整迁移到 `/Users/a1/Desktop/infinite-canvas/web`。

目标项目已经有画布助手骨架：`src/app/(user)/canvas/components/canvas-assistant-panel.tsx`，并且已经支持会话、历史、图片引用、文本问答、图片生成和插入画布。因此建议采用“融合迁移”而不是逐文件照搬 TwitCanva 的 Vite + Express 实现。

## 一、迁移目标

需要移植的能力包含：

1. 画布页面右下角显示一个 Chat 浮动按钮。
2. 点击按钮后显示右侧 Chat 面板。
3. Chat 面板可以关闭，关闭后重新显示浮动按钮。
4. 面板内支持发送文本消息。
5. 面板内支持把画布图片/文本作为上下文引用给 AI。
6. 支持历史会话、新建会话、删除会话。
7. 支持将 AI 回复文本插入画布。
8. 支持将 AI 生成图片插入画布。
9. 会话跟随当前画布项目保存和恢复。

## 二、源项目功能拆解

TwitCanva 中相关文件如下：

| 源文件 | 作用 | 是否建议直接搬 |
| --- | --- | --- |
| `src/hooks/usePanelState.ts` | 管理 `isChatOpen`、`toggleChat`、`closeChat` | 只搬逻辑思想，不建议整文件搬 |
| `src/components/ChatPanel.tsx` | Chat 面板 UI、输入框、拖拽媒体、历史面板、发送消息 | 可参考 UI，但目标项目已有更合适的 `CanvasAssistantPanel` |
| `src/components/ChatMessage.tsx` | 消息气泡、附件预览、代码块复制 | 可拆出“代码块渲染”能力补到目标项目 |
| `src/hooks/useChatAgent.ts` | 前端聊天状态、请求 `/api/chat`、会话列表 | 不建议搬，目标项目会话已经在画布项目内 |
| `public/chat-preview.gif` | 空态提示动图 | 可选搬到目标项目 `public/` |
| `server/index.js` 的 `/api/chat` | Express Chat API | 不建议原样搬，目标项目是 Next + Go/代理体系 |
| `server/agent/*` | LangGraph + Gemini agent | 只有在需要完全复刻 TwitCanva agent 时才搬 |

TwitCanva 最小弹窗逻辑是：

```tsx
const [isChatOpen, setIsChatOpen] = useState(false);

const toggleChat = () => setIsChatOpen((value) => !value);
const closeChat = () => setIsChatOpen(false);

<ChatBubble onClick={toggleChat} isOpen={isChatOpen} />
<ChatPanel isOpen={isChatOpen} onClose={closeChat} />
```

`ChatBubble` 通过 `fixed bottom-6 right-6` 固定在右下角；`ChatPanel` 通过 `fixed top-0 right-0 w-[400px] h-full` 从右侧显示。

## 三、目标项目现状

目标项目是：

- Next.js App Router
- React 19
- TypeScript
- Ant Design
- Tailwind
- Zustand
- `localforage` 本地持久化

目标项目中已经存在这些 Chat/Assistant 基础设施：

| 目标文件 | 当前能力 |
| --- | --- |
| `src/app/(user)/canvas/[id]/canvas-client-page.tsx` | 管理画布节点、会话状态、助手面板开关、插入图片/文本 |
| `src/app/(user)/canvas/components/canvas-assistant-panel.tsx` | 右侧助手面板、消息列表、输入框、历史记录、问答/生图模式 |
| `src/app/(user)/canvas/types.ts` | `CanvasAssistantSession`、`CanvasAssistantMessage`、`CanvasAssistantReference` 类型 |
| `src/app/(user)/canvas/stores/use-canvas-store.ts` | 项目持久化，已经保存 `chatSessions` 和 `activeChatId` |
| `src/services/api/image.ts` | 已有 `requestImageQuestion`，通过 OpenAI 兼容 `/chat/completions` 流式问答 |
| `src/services/image-storage.ts` | 图片上传、恢复、转 data URL |

因此核心迁移策略是：

1. 不搬 `useChatAgent.ts`。
2. 不搬 Express `/api/chat`。
3. 不强依赖 LangGraph。
4. 复用目标项目的 `CanvasAssistantPanel` 作为 ChatPanel。
5. 给目标项目增加 TwitCanva 风格的右下角浮动按钮。
6. 按需要把 TwitCanva 的消息气泡、空态提示、拖拽体验融合进现有助手面板。

## 四、推荐迁移方案

推荐采用“融合迁移”：

```txt
TwitCanva ChatBubble
        ↓
目标项目 CanvasTopBar/Canvas 页面右下角新增浮动入口

TwitCanva ChatPanel
        ↓
目标项目 CanvasAssistantPanel

TwitCanva useChatAgent
        ↓
目标项目 CanvasAssistantPanel 内部 sendMessage + requestImageQuestion

TwitCanva chat sessions API
        ↓
目标项目 useCanvasStore 的 chatSessions / activeChatId

TwitCanva 拖拽节点到 Chat
        ↓
目标项目选中节点自动作为 selectedReferences，或后续补拖拽附加
```

这样迁移后，功能更贴合目标项目现有架构，也避免引入第二套聊天状态和第二套后端。

## 五、实施步骤

### 1. 增加右下角浮动 Chat 按钮

目标文件：

```txt
src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

当前目标项目入口在顶部右侧：

```tsx
<Button
    icon={<MessageSquare className="size-4" />}
    onClick={onExpandAssistant}
>
    助手
</Button>
```

如果要完全复刻 TwitCanva 的“右下角点击弹出”体验，可以在 `InfiniteCanvasPage` 的 `<section className="relative ...">` 内增加一个浮动按钮。建议位置放在 `CanvasZoomControls` 后、各种 Modal 前。

新增局部组件：

```tsx
function CanvasChatBubble({ onClick }: { onClick: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];

    return (
        <button
            type="button"
            className="absolute bottom-6 right-6 z-50 grid size-12 place-items-center rounded-full transition hover:scale-105"
            style={{
                background: theme.toolbar.activeBg,
                color: theme.toolbar.activeText,
                boxShadow: "0 18px 40px rgba(0,0,0,.20)",
            }}
            onClick={onClick}
            aria-label="打开画布助手"
        >
            <MessageSquare className="size-5" />
        </button>
    );
}
```

在页面 JSX 中渲染：

```tsx
{assistantCollapsed ? (
    <CanvasChatBubble
        onClick={() => {
            setAssistantMounted(true);
            setAssistantCollapsed(false);
        }}
    />
) : null}
```

注意：

- 使用 `absolute` 而不是 `fixed`，让按钮只属于画布区域，不压到右侧面板。
- 如果希望像 TwitCanva 一样永远贴浏览器右下角，可改成 `fixed bottom-6 right-6`。
- 目标项目已有顶部“助手”按钮，二选一即可；如果保留两处入口，两个入口都调用同一段展开逻辑。

### 2. 统一助手展开/关闭状态

目标项目已有状态：

```tsx
const [assistantCollapsed, setAssistantCollapsed] = useState(true);
const [assistantMounted, setAssistantMounted] = useState(false);
```

它等价于 TwitCanva 的：

```tsx
const [isChatOpen, setIsChatOpen] = useState(false);
```

建议整理成两个小函数，避免顶部按钮和右下角按钮重复写：

```tsx
const openAssistant = useCallback(() => {
    setAssistantMounted(true);
    setAssistantCollapsed(false);
}, []);

const closeAssistant = useCallback(() => {
    setAssistantCollapsed(true);
}, []);
```

然后：

```tsx
<CanvasTopBar
    assistantCollapsed={assistantCollapsed}
    onExpandAssistant={openAssistant}
/>

{assistantCollapsed ? <CanvasChatBubble onClick={openAssistant} /> : null}

<CanvasAssistantPanel
    onCollapseStart={closeAssistant}
    onCollapse={() => setAssistantMounted(false)}
/>
```

### 3. 复用目标项目的 `CanvasAssistantPanel`

目标文件：

```txt
src/app/(user)/canvas/components/canvas-assistant-panel.tsx
```

它已经包含以下 TwitCanva ChatPanel 对应能力：

| TwitCanva | 目标项目 |
| --- | --- |
| `ChatPanel` 右侧面板 | `CanvasAssistantPanel` |
| `showHistory` | `view: "chat" | "history"` |
| `handleNewChat` | `startChatSession` |
| `messages.map(ChatMessage)` | `AssistantMessages` |
| `textarea + handleSend` | `AssistantComposer` |
| `sendMessage` | `sendMessage` |
| `attachedMedia` | `selectedReferences` |
| `onClose` | `collapse` |

当前标题仍写着：

```tsx
{view === "history" ? "历史记录" : "画布助手(未开发)"}
```

迁移时应改成：

```tsx
{view === "history" ? "历史记录" : "画布助手"}
```

### 4. 保留目标项目的问答链路

目标项目当前问答链路在 `canvas-assistant-panel.tsx`：

```tsx
const answer = await requestImageQuestion(
    requestConfig,
    await buildChatMessages([...history, userMessage]),
    (streamed) => {
        updateMessage(session.id, assistantId, { text: streamed, isLoading: false });
    },
);
```

底层请求在：

```txt
src/services/api/image.ts
```

核心接口：

```ts
export async function requestImageQuestion(
    config: AiConfig,
    messages: ChatCompletionMessage[],
    onDelta: (text: string) => void,
) {
    const response = await axios.post(
        aiApiUrl(config, "/chat/completions"),
        {
            model: config.model,
            messages: withSystemMessage(config, messages),
            stream: true,
        },
        ...
    );
}
```

这条链路已经比 TwitCanva 的 `/api/chat` 更贴合目标项目，因为它：

- 使用目标项目现有 API Key 配置。
- 支持 remote/local channel。
- 支持流式输出。
- 支持图片上下文。
- 与积分、用户状态刷新逻辑兼容。

因此不建议移植 TwitCanva 的：

```txt
src/hooks/useChatAgent.ts
server/index.js /api/chat
server/agent/*
```

除非明确要复刻 TwitCanva 的 LangGraph + Gemini agent。

### 5. 迁移空态提示和欢迎区

TwitCanva 空态在 `ChatPanel.tsx` 中包含：

- `Hi, Creator`
- `Looking for inspiration?`
- `/chat-preview.gif`
- “Drag image/video nodes into the chat dialog ...”

目标项目当前空态是：

```tsx
<div className="flex h-full flex-col items-center justify-center px-1 text-center">
    <div className="relative font-serif text-4xl font-bold italic tracking-normal">
        <span>Infinite Canvas</span>
        ...
    </div>
    <div className="mt-3 font-serif text-base italic tracking-wide opacity-60">
        One canvas, infinite ideas
    </div>
</div>
```

建议改成中文且贴合目标项目：

```tsx
<div className="flex h-full flex-col items-center justify-center px-6 text-center">
    <Sparkles className="mb-4 size-8 opacity-70" />
    <div className="text-lg font-semibold">需要灵感吗？</div>
    <div className="mt-2 max-w-[260px] text-sm leading-6 opacity-60">
        选中画布上的图片或文本节点后提问，助手会自动把它们作为上下文。
    </div>
</div>
```

如果要保留 TwitCanva 动图：

1. 复制：

```txt
/Users/a1/Desktop/无限画布项目汇总/TwitCanva-Video-Workflow/public/chat-preview.gif
```

到：

```txt
/Users/a1/Desktop/infinite-canvas/web/public/chat-preview.gif
```

2. 在空态中使用：

```tsx
<img
    src="/chat-preview.gif"
    alt=""
    className="mb-4 w-full max-w-[260px] rounded-2xl object-cover"
/>
```

### 6. 迁移消息气泡的代码块能力

TwitCanva 的 `ChatMessage.tsx` 支持解析：

```md
```js
console.log("hello")
```
```

并显示复制按钮。

目标项目 `AssistantMessages` 当前只是直接展示：

```tsx
{message.text}
```

如果需要完整迁移代码块体验，可以把 TwitCanva 的 `parseContent` 和 `CodeBlock` 合并进 `canvas-assistant-panel.tsx`，然后在 `AssistantMessages` 中替换文本渲染。

建议新增：

```tsx
function parseAssistantContent(content: string): Array<{ type: "text" | "code"; content: string }> {
    const segments: Array<{ type: "text" | "code"; content: string }> = [];
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index).trim();
            if (text) segments.push({ type: "text", content: text });
        }
        segments.push({ type: "code", content: match[1].trim() });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        const text = content.slice(lastIndex).trim();
        if (text) segments.push({ type: "text", content: text });
    }

    return segments.length ? segments : [{ type: "text", content }];
}
```

再增加复制按钮组件：

```tsx
function AssistantCodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const theme = canvasThemes[useThemeStore((state) => state.theme)];

    return (
        <div className="group relative my-2">
            <pre className="thin-scrollbar overflow-x-auto rounded-xl border p-3 text-xs" style={{ background: theme.node.panel, borderColor: theme.node.stroke }}>
                <code>{code}</code>
            </pre>
            <Button
                size="small"
                shape="circle"
                className="!absolute !right-2 !top-2 opacity-0 transition group-hover:opacity-100"
                icon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                onClick={async () => {
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                }}
                title={copied ? "已复制" : "复制"}
            />
        </div>
    );
}
```

需要同步增加 import：

```tsx
import { Check, Copy } from "lucide-react";
```

在消息气泡里渲染：

```tsx
{parseAssistantContent(message.text).map((segment, index) =>
    segment.type === "code" ? (
        <AssistantCodeBlock key={index} code={segment.content} />
    ) : (
        <div key={index}>{segment.content}</div>
    ),
)}
```

### 7. 迁移“把节点内容带入 Chat”的体验

TwitCanva 是通过拖拽节点到 Chat 面板来附加媒体：

```tsx
const nodeData = e.dataTransfer.getData("application/json");
const { nodeId, url, type } = JSON.parse(nodeData);
setAttachedMedia(...)
```

目标项目已有更轻量的方式：选中节点后自动构造引用：

```tsx
const allSelectedReferences = useMemo(
    () => buildAssistantReferences(nodes, selectedNodeIds),
    [nodes, selectedNodeIds],
);
```

支持：

```tsx
if (node.type === CanvasNodeType.Image && node.metadata?.content) {
    return { id: node.id, type: node.type, title: node.title, dataUrl: node.metadata.content, storageKey: node.metadata.storageKey };
}

if (node.type === CanvasNodeType.Text && node.metadata?.content) {
    return { id: node.id, type: node.type, title: node.title, text: node.metadata.content };
}
```

推荐保留目标项目的“选中即引用”。

如果一定要复刻“拖拽到 Chat 面板”：

1. 在 `CanvasNode` 开始拖拽时写入 `dataTransfer`。
2. 在 `CanvasAssistantPanel` 增加 `onDragEnter`、`onDragOver`、`onDrop`。
3. drop 后把对应 node id 加入 `selectedNodeIds`，从而复用现有 `selectedReferences`。

伪代码：

```tsx
const handleAssistantDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const nodeId = event.dataTransfer.getData("application/x-canvas-node-id");
    if (!nodeId) return;
    onSelectNodeIds(new Set([nodeId]));
};
```

这比 TwitCanva 的 `attachedMedia` 更适合目标项目，因为图片转换、storageKey 恢复、引用标签都已经在目标项目里处理好了。

### 8. 会话保存方式

TwitCanva 会话保存到服务器文件：

```txt
library/chats/*.json
```

目标项目会话保存到当前画布项目：

```ts
export type CanvasProject = {
    chatSessions: CanvasAssistantSession[];
    activeChatId: string | null;
};
```

页面中已经有：

```tsx
const [chatSessions, setChatSessions] = useState<CanvasAssistantSession[]>([]);
const [activeChatId, setActiveChatId] = useState<string | null>(null);
```

以及：

```tsx
const handleAssistantSessionsChange = useCallback((sessions: CanvasAssistantSession[], activeId: string | null) => {
    setChatSessions(sessions);
    setActiveChatId(activeId);
}, []);
```

`useCanvasStore` 已经持久化：

```tsx
updateProject(projectId, { nodes, connections, chatSessions, activeChatId, backgroundMode, showImageInfo });
```

因此迁移时不要新增 `/api/chat/sessions`，也不要把会话拆到另一个 storage。否则会出现“画布项目和聊天历史不同步”的问题。

### 9. 后端与模型调用策略

有两种路线：

#### 路线 A：沿用目标项目 OpenAI 兼容接口，推荐

不新增后端。继续使用：

```txt
src/services/api/image.ts -> requestImageQuestion()
```

优点：

- 与目标项目配置、鉴权、积分、remote/local channel 一致。
- 支持 OpenAI 兼容模型。
- 支持流式输出。
- 不引入 LangGraph 依赖。

需要做的只是给 `systemPrompt` 配一个更像 TwitCanva 的默认提示词，例如：

```txt
你是 Infinite Canvas 的创意助手，擅长根据画布中的图片、文本和创作目标提供提示词、分镜、广告文案、视觉风格建议和生成策略。回答应简洁、具体、可直接用于后续生成。
```

#### 路线 B：完整复刻 TwitCanva LangGraph agent

只有当必须保留 TwitCanva 的 Gemini agent 行为时才使用。

需要新增依赖：

```txt
@langchain/core
@langchain/google-genai
@langchain/langgraph
```

需要迁移：

```txt
server/agent/index.js
server/agent/graph/chatGraph.js
server/agent/prompts/system.js
```

并在目标项目中新增 Next Route：

```txt
src/app/api/canvas-chat/route.ts
```

但这会绕过目标项目现有 Go 后端、`/api/v1` 代理和用户配置体系，维护成本较高，不推荐作为第一阶段。

## 六、建议改动清单

第一阶段只做 UI 和现有能力打通：

```txt
src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

- 新增 `openAssistant`。
- 新增 `CanvasChatBubble`。
- 在画布右下角渲染浮动按钮。
- 顶部“助手”按钮复用 `openAssistant`。

```txt
src/app/(user)/canvas/components/canvas-assistant-panel.tsx
```

- 标题从 `画布助手(未开发)` 改为 `画布助手`。
- 空态文案改成中文助手说明。
- 可选加入 TwitCanva 的 `chat-preview.gif`。
- 可选加入代码块渲染和复制按钮。

```txt
public/chat-preview.gif
```

- 可选，从 TwitCanva 复制。

第二阶段补体验增强：

```txt
src/app/(user)/canvas/components/canvas-node.tsx
src/app/(user)/canvas/components/canvas-assistant-panel.tsx
```

- 可选实现“拖拽节点到助手面板引用”。
- 推荐内部仍转成 `selectedNodeIds`，不要新增第二套 `attachedMedia`。

第三阶段才考虑 agent 后端：

```txt
src/app/api/canvas-chat/route.ts
```

- 仅当需要 LangGraph agent 时新增。

## 七、关键数据流

### 打开 Chat

```txt
点击右下角按钮
    -> openAssistant()
    -> setAssistantMounted(true)
    -> setAssistantCollapsed(false)
    -> 渲染 CanvasAssistantPanel
```

### 关闭 Chat

```txt
点击面板关闭按钮
    -> collapse()
    -> onCollapseStart()
    -> setAssistantCollapsed(true)
    -> 动画结束 onCollapse()
    -> setAssistantMounted(false)
    -> 右下角按钮重新出现
```

### 发送文本问答

```txt
AssistantComposer 输入文本
    -> submit()
    -> sendMessage(text, "ask", messages)
    -> append user message
    -> append loading assistant message
    -> buildChatMessages()
    -> requestImageQuestion()
    -> 流式 updateMessage()
    -> onSessionsChange()
    -> chatSessions 保存到当前画布项目
```

### 带图片上下文提问

```txt
用户选中图片节点
    -> selectedNodeIds
    -> buildAssistantReferences()
    -> selectedReferences
    -> AssistantComposer 显示引用 chip
    -> buildChatMessages()
    -> imageToDataUrl()
    -> requestImageQuestion()
```

### 插入回复到画布

```txt
AssistantMessages 点击插入按钮
    -> onInsertText(message.text)
    -> insertAssistantText()
    -> createCanvasNode(CanvasNodeType.Text)
    -> setNodes()
```

### 插入生成图到画布

```txt
AssistantMessages 点击图片插入按钮
    -> onInsertImage(image)
    -> insertAssistantImage()
    -> uploadImage()
    -> create image node
    -> setNodes()
```

## 八、不要照搬的内容

不要直接照搬这些内容：

1. 不要把 TwitCanva 的 `useChatAgent.ts` 直接放进目标项目。
2. 不要新增 `/api/chat/sessions`，目标项目已经用 `chatSessions` 保存到画布项目。
3. 不要在目标项目前端硬编码 Gemini API Key。
4. 不要把 Express server 迁到 Next 前端项目里。
5. 不要新增第二套图片 base64 缓存逻辑，继续使用 `image-storage.ts`。
6. 不要在 Chat 面板里硬编码深色背景，应使用 `canvasThemes` 和当前主题。

## 九、验收标准

完成迁移后，应满足：

1. 打开画布页面后，右下角可以看到 Chat/助手浮动按钮。
2. 点击浮动按钮，右侧助手面板展开。
3. 面板展开后，浮动按钮隐藏。
4. 点击面板关闭按钮，面板收起，浮动按钮重新出现。
5. 输入文本并发送，可以收到 AI 回复。
6. 选中图片节点后提问，AI 能基于图片回答。
7. 选中文本节点后提问，AI 能读取文本上下文。
8. 新建会话、历史会话、删除会话正常。
9. 刷新当前画布后，聊天记录仍存在。
10. AI 回复文本可以插入为文本节点。
11. AI 生成图片可以插入为图片节点。
12. 深色/浅色主题下按钮和面板都不突兀。

## 十、推荐实施顺序

1. 先新增右下角 `CanvasChatBubble`，打通打开/关闭。
2. 把标题里的“未开发”去掉。
3. 调整空态文案。
4. 验证当前 `ask` 模式可用。
5. 验证选中图片/文本节点后上下文引用可用。
6. 再补代码块渲染。
7. 最后再决定是否需要拖拽节点到 Chat。

## 十一、最小迁移版本

如果只想先实现“点击右下角弹出 Chat 面板”，最小改动只有：

```txt
src/app/(user)/canvas/[id]/canvas-client-page.tsx
```

新增：

```tsx
const openAssistant = useCallback(() => {
    setAssistantMounted(true);
    setAssistantCollapsed(false);
}, []);
```

把顶部按钮改为：

```tsx
onExpandAssistant={openAssistant}
```

再新增：

```tsx
{assistantCollapsed ? <CanvasChatBubble onClick={openAssistant} /> : null}
```

以及组件：

```tsx
function CanvasChatBubble({ onClick }: { onClick: () => void }) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];

    return (
        <button
            type="button"
            className="absolute bottom-6 right-6 z-50 grid size-12 place-items-center rounded-full transition hover:scale-105"
            style={{
                background: theme.toolbar.activeBg,
                color: theme.toolbar.activeText,
                boxShadow: "0 18px 40px rgba(0,0,0,.20)",
            }}
            onClick={onClick}
            aria-label="打开画布助手"
        >
            <MessageSquare className="size-5" />
        </button>
    );
}
```

这样就完成了 TwitCanva 中最核心的弹出逻辑迁移：

```txt
ChatBubble click -> open state -> render right assistant panel -> close -> restore bubble
```
