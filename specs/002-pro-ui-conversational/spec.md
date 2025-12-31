# Feature Specification: 商业级前端UI + 多轮对话迭代

**Feature Branch**: `002-pro-ui-conversational`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "商业级前端UI重构 + 多轮对话迭代修改功能"

## Clarifications

### Session 2025-12-31
- Q: Where should conversation history and state be persisted? → A: **Client-side (LocalStorage)**. Keeps architecture stateless; history is browser-bound and cleared on cache reset.
- Q: Which external libraries are allowed in generated visualizations? → A: **Curated List (Strict)**. Restricted to `react`, `recharts`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`. Ensures stability in Sandpack environment.
- Q: How should conversation context be passed to the LLM for modifications? → A: **Smart Append (Full History)**. Send full conversation array (messages + code snapshots). Truncate oldest messages if token limit is reached.
- Q: How to ensure generated code is safe and valid before sending to frontend? → A: **Backend Validation (Static Analysis)**. Python backend performs AST parsing and checks import allowlists/blocklists to catch forbidden modules or syntax errors.
- Q: Should the API response be streaming or blocking? → A: **Blocking JSON**. Simplifies state management. Frontend shows "Thinking..." state until full JSON with code/explanation is received.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 全屏可视化体验 (Priority: P1)

用户打开 Concept Canvas 应用，希望获得一个专业、现代的界面体验。界面布局合理，左侧输入区域足够宽敞可以舒适地输入问题，右侧可视化渲染区域能够完整展示生成的交互式图表，不会出现内容被截断或需要滚动才能看到的情况。

**Why this priority**: 这是产品的核心体验基础。如果用户连基本的界面都无法正常使用（输入框太小、渲染区域只显示一半），其他功能再强大也毫无意义。这直接影响用户的第一印象和留存率。

**Independent Test**: 可以通过在不同设备和屏幕尺寸上访问应用，验证布局是否正确适配，所有内容是否完整可见。

**Acceptance Scenarios**:

1. **Given** 用户在桌面端（宽度 ≥ 1024px）打开应用, **When** 页面加载完成, **Then** 左侧输入区域占据约 35-40% 宽度且输入框高度适中，右侧可视化区域占据剩余空间且内容完整显示无截断
2. **Given** 用户在平板端（768px ≤ 宽度 < 1024px）打开应用, **When** 页面加载完成, **Then** 布局自动调整为适合平板的比例，两侧内容均可完整使用
3. **Given** 用户在移动端（宽度 < 768px）打开应用, **When** 页面加载完成, **Then** 布局切换为上下堆叠模式，输入区域在上方，可视化区域在下方，均可完整展示
4. **Given** 用户调整浏览器窗口大小, **When** 窗口尺寸变化, **Then** 界面平滑响应式调整，无布局错乱或内容溢出

---

### User Story 2 - 对话式迭代修改 (Priority: P1)

用户生成了一个可视化演示后，发现某些细节不满意（如小球太小、颜色看不清、想增加新的交互控件）。用户可以直接在当前界面旁边的对话框中用自然语言描述修改需求，如"把红色小球变大一点"或"增加一个空气阻力的滑块"，系统理解上下文并智能更新可视化，而不是重新生成全部内容。

**Why this priority**: 这是本次迭代的核心价值点。让用户从"使用者"变成"创造者"，通过自然语言编程的体验极大提升产品粘性和用户满意度。

**Independent Test**: 可以通过生成一个可视化后，发送修改指令，验证系统是否正确理解并增量更新。

**Acceptance Scenarios**:

1. **Given** 用户已生成一个重力演示可视化, **When** 用户输入"把小球变大一点", **Then** 系统更新可视化，小球尺寸增大，其他元素保持不变
2. **Given** 用户已生成一个正弦波图表, **When** 用户输入"把线条颜色改成蓝色", **Then** 系统更新图表，线条变为蓝色，波形参数保持不变
3. **Given** 用户已生成一个物理演示, **When** 用户输入"增加一个显示速度的仪表盘", **Then** 系统在现有演示基础上添加速度仪表盘组件
4. **Given** 用户已生成一个可视化, **When** 用户输入一个全新的、与当前可视化无关的问题, **Then** 系统识别为新话题，生成全新的可视化

---

### User Story 3 - 对话历史与上下文管理 (Priority: P2)

用户在多轮对话修改过程中，可以查看之前的对话历史，了解自己做过哪些修改。系统维护完整的对话上下文，确保每次修改都基于正确的历史状态。

**Why this priority**: 这是多轮对话功能的支撑能力。没有良好的历史管理，用户会迷失在修改过程中，也无法回溯之前的状态。

**Independent Test**: 可以通过进行多轮对话修改，验证历史记录是否正确显示，上下文是否正确维护。

**Acceptance Scenarios**:

1. **Given** 用户进行了多轮对话修改, **When** 用户查看对话历史, **Then** 所有历史消息按时间顺序显示，包括用户输入和系统响应，且数据持久化在本地浏览器缓存中
2. **Given** 用户在第 5 轮对话中, **When** 用户发送新的修改请求, **Then** 系统基于完整的前 4 轮上下文理解并处理请求
3. **Given** 用户想开始一个全新的可视化, **When** 用户点击"新建对话", **Then** 系统清空当前对话历史，开始新的会话

---

### User Story 4 - 专业级视觉设计 (Priority: P2)

应用界面采用现代化的视觉设计语言，包括精心设计的配色方案、适当的留白、流畅的动画过渡、清晰的视觉层次，给用户专业可信赖的产品印象。

**Why this priority**: 商业化产品需要专业的视觉形象来建立用户信任。虽然不影响核心功能，但直接影响用户对产品价值的感知。

**Independent Test**: 可以通过视觉走查和用户反馈验证设计质量。

**Acceptance Scenarios**:

1. **Given** 用户首次打开应用, **When** 页面加载完成, **Then** 用户看到现代化、专业的界面设计，配色和谐，布局清晰
2. **Given** 用户与界面交互（点击、输入、切换）, **When** 交互发生, **Then** 界面提供流畅的动画反馈，过渡自然
3. **Given** 用户在不同主题模式下使用（明/暗模式）, **When** 切换主题, **Then** 界面正确适配，颜色对比度符合可访问性标准

---

### User Story 5 - 加载状态与错误处理优化 (Priority: P3)

在生成和修改可视化的过程中，用户能够清晰地了解当前状态（加载中、成功、失败），错误信息友好且有指导性，帮助用户理解问题并采取行动。

**Why this priority**: 良好的状态反馈是用户体验的重要组成部分，但相比核心功能优先级较低。

**Independent Test**: 可以通过模拟各种状态和错误场景验证反馈是否正确。

**Acceptance Scenarios**:

1. **Given** 用户提交生成请求, **When** 系统正在处理, **Then** 显示优雅的加载动画和进度提示
2. **Given** 生成过程中发生错误, **When** 错误发生, **Then** 显示友好的错误提示，说明可能的原因和建议的解决方案
3. **Given** 网络连接中断, **When** 用户尝试操作, **Then** 系统检测到网络问题并提示用户检查网络连接

---

### Edge Cases

- 用户输入的修改指令模糊不清时，系统应请求澄清而非猜测
- 用户快速连续发送多条修改请求时，系统应按顺序处理或合并处理
- 对话历史过长时，系统应合理截断或摘要以保持性能
- 生成的可视化代码执行出错时，应显示友好的错误提示而非崩溃
- 用户在可视化加载过程中发送新请求时，应取消前一个请求或排队处理
- 用户清除浏览器缓存导致历史记录丢失（需在界面有适当提示或作为已知行为）

## Requirements *(mandatory)*

### Functional Requirements

**布局与响应式**

- **FR-001**: 系统 MUST 提供全屏可用的分栏布局，左侧输入/对话区域和右侧可视化渲染区域均能完整显示内容
- **FR-002**: 系统 MUST 支持响应式布局，在桌面端（≥1024px）、平板端（768px-1024px）、移动端（<768px）三种断点下自动适配
- **FR-003**: 系统 MUST 允许用户通过拖拽分隔条调整左右面板比例
- **FR-004**: 可视化渲染区域 MUST 完整显示生成的内容，不出现内容截断或需要滚动才能看到主要内容的情况

**多轮对话**

- **FR-005**: 系统 MUST 支持在已生成可视化的基础上进行对话式迭代修改
- **FR-006**: 系统 MUST 维护对话上下文，理解用户的修改请求与当前可视化的关系
- **FR-007**: 系统 MUST 支持增量代码更新，只修改需要变动的部分而非重新生成全部代码
- **FR-008**: 系统 MUST 能够识别用户是在修改当前可视化还是开始一个全新话题
- **FR-009**: 用户 MUST 能够查看当前会话的对话历史 (Persisted in LocalStorage)
- **FR-010**: 用户 MUST 能够开始新的对话会话，清空历史上下文

**视觉与交互**

- **FR-011**: 系统 MUST 提供现代化的视觉设计，包括专业的配色方案和清晰的视觉层次
- **FR-012**: 系统 MUST 提供流畅的交互动画和过渡效果
- **FR-013**: 系统 MUST 支持明/暗主题模式
- **FR-014**: 系统 MUST 在加载过程中显示清晰的进度指示
- **FR-015**: 系统 MUST 在发生错误时显示友好的错误提示和建议

**API 交互**

- **FR-021**: API 交互采用 **Blocking JSON** 模式，客户端请求后等待完整响应
- **FR-022**: 客户端 MUST 在等待响应期间显示明确的"思考中/生成中"加载状态

**依赖管理**

- **FR-016**: 生成的代码 MUST 仅引用以下允许的外部库: `react`, `recharts`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`
- **FR-017**: 后端提示词 MUST 显式包含允许的库列表，防止生成不可运行的代码
- **FR-020**: 后端 MUST 在返回响应前通过静态分析（AST Parsing）校验生成的代码，确保无语法错误且未引用禁用模块

**上下文管理**

- **FR-018**: 后端 MUST 接收完整对话历史（包括之前的代码快照），用于 LLM 上下文构建
- **FR-019**: 若历史记录超过 token 限制，后端 MUST 执行滑动窗口策略，保留最早的 System Prompt 和最近 N 轮对话

### Key Entities (Client-Side Schema)

- **Conversation**: { id: string, createdAt: number, messages: Message[], currentVisualCode: string }
- **Message**: { role: 'user' | 'assistant', content: string, timestamp: number, codeSnippet?: string }
- **Visualization**: { code: string, explanation: string, version: number }
- **ModificationRequest**: 用户的修改意图，包含原始输入、解析后的修改类型、目标元素

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 在所有目标设备尺寸（桌面、平板、移动端）上，界面布局正确率达到 100%，无内容截断或溢出
- **SC-002**: 用户完成一次迭代修改的平均时间不超过 30 秒（从输入到看到更新结果）
- **SC-003**: 增量修改请求的处理成功率达到 90% 以上（系统正确理解并执行修改意图）
- **SC-004**: 用户满意度评分达到 4.0/5.0 以上（针对界面美观度和易用性）
- **SC-005**: 页面首次加载时间不超过 3 秒（在标准网络条件下）
- **SC-006**: 交互动画帧率保持在 60fps，无明显卡顿
- **SC-007**: 80% 的用户能够在无指导情况下成功完成"生成 → 修改 → 再修改"的完整流程

## Assumptions

- 用户使用现代浏览器（Chrome、Firefox、Safari、Edge 最新两个主版本）
- 用户网络环境能够正常访问后端 API
- LLM 服务能够理解上下文并生成增量修改代码
- 现有的 Sandpack 组件能够支持动态代码更新
- 用户若清除浏览器数据，接受对话历史丢失
