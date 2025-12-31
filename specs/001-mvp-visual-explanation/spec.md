# Feature Specification: MVP 生成式可视化解释工具

**Feature Branch**: `001-mvp-visual-explanation`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: MVP版本：生成式可视化解释工具 - 将用户自然语言提问转化为动态 React 组件并实时渲染

---

## Clarifications

### Session 2025-12-31

- Q: How should the visualization result be displayed relative to the input area? → A: **Split/Scroll View**: Input area remains visible (e.g., sticky top/bottom or split pane); result appears in main view.
- Q: How should the backend enforce the JSON structure from the LLM? → A: **Strict JSON Mode**: Use the LLM provider's native JSON mode or function calling features to enforce structure.
- Q: How should the system handle cases where the LLM returns invalid JSON despite enforcement? → A: **Auto-Retry (Backend)**: The backend automatically retries the generation (up to N times) if JSON validation fails.
- Q: What should be the fallback behavior if the user asks a question that is abstract and hard to visualize? → A: **Generic Visualization**: Default to a generic chart or concept map that visualizes the "structure" of the answer if no specific visualization fits.
- Q: Does the system need to sanitize or validate the generated React code for security risks on the backend? → A: **Sandpack Isolation Only**: Rely on the frontend sandbox (iframe) for security; no backend code parsing/sanitization for MVP.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 输入问题获得可视化解释 (Priority: P1)

用户在输入框中输入一个关于科学/数学概念的自然语言问题（如"展示正态分布"），
系统调用大模型生成文本解释和可交互的组件代码，前端实时渲染该组件，
用户可以看到动态可视化内容并与之交互（拖动滑块、点击按钮等）。

**Why this priority**: 这是产品的核心价值主张，没有这个功能产品无法交付任何价值。

**Independent Test**: 可以通过输入一个简单问题（如"展示正弦波"）并验证是否显示可交互图表来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户在首页看到输入框, **When** 用户输入"展示正态分布的概念", **Then** 系统显示加载状态并在合理时间内返回文本解释和可视化组件
2. **Given** 系统已返回生成结果, **When** 用户查看结果区域, **Then** 用户看到简短的文本解释和一个可交互的图表/动画，**同时输入框保持可见以便调整提问**
3. **Given** 可视化组件已渲染, **When** 用户拖动滑块或点击按钮, **Then** 图表/动画实时响应并更新显示

---

### User Story 2 - 查看文本解释 (Priority: P1)

用户在获得可视化结果的同时，能够阅读一段简洁的文字解释，帮助理解可视化内容的含义。

**Why this priority**: 文本解释与可视化同等重要，二者结合才能完整传达概念。

**Independent Test**: 可以验证每次生成结果都包含非空的文本解释内容。

**Acceptance Scenarios**:

1. **Given** 用户已提交问题, **When** 系统返回结果, **Then** 结果中包含一段简洁明了的文字解释
2. **Given** 文字解释已显示, **When** 用户阅读解释, **Then** 解释内容与可视化主题相关且易于理解

---

### User Story 3 - 错误处理与反馈 (Priority: P2)

当系统无法生成有效结果时（如网络错误、生成内容无法渲染），用户能够看到友好的错误提示，
并有机会重新尝试。

**Why this priority**: 错误处理是基本的用户体验保障，但不是核心功能。

**Independent Test**: 可以通过模拟错误场景（如断网、无效输入）验证错误提示是否正确显示。

**Acceptance Scenarios**:

1. **Given** 用户已提交问题, **When** 后端服务不可用, **Then** 用户看到友好的错误提示（如"服务暂时不可用，请稍后重试"）
2. **Given** 用户已提交问题, **When** 生成的内容无法渲染, **Then** 用户看到错误提示并可以重新输入问题
3. **Given** 用户看到错误提示, **When** 用户点击重试或重新输入, **Then** 系统允许用户再次提交问题

---

### User Story 4 - 加载状态反馈 (Priority: P2)

在等待大模型生成结果期间，用户能够看到明确的加载状态，了解系统正在处理请求。

**Why this priority**: 加载状态减少用户焦虑，提升体验，但不影响核心功能。

**Independent Test**: 可以验证提交问题后立即显示加载指示器，结果返回后消失。

**Acceptance Scenarios**:

1. **Given** 用户已提交问题, **When** 系统正在处理请求, **Then** 用户看到加载指示器（如旋转图标或进度条）
2. **Given** 系统正在加载, **When** 结果返回, **Then** 加载指示器消失，结果正常显示

---

### Edge Cases

- **空输入**: 用户未输入任何内容就点击提交，系统应提示"请输入您的问题"
- **超长输入**: 用户输入超过合理长度的文本，系统应限制输入长度或给出提示
- **无关问题/抽象问题**: 用户输入难以直接可视化的概念（如"什么是哲学"），系统应尝试生成通用概念图或流程图，而非报错
- **网络中断**: 请求过程中网络断开，系统应显示网络错误提示
- **渲染失败**: 生成的内容存在问题无法渲染，系统应显示友好错误而非白屏
- **重复提交**: 用户在等待期间多次点击提交，系统应防止重复请求
- **JSON 解析失败**: 后端应在多次重试失败后才向用户返回生成错误

---

## Requirements *(mandatory)*

### Functional Requirements

#### 前端功能

- **FR-001**: 系统 MUST 提供一个文本输入框，允许用户输入自然语言问题
- **FR-002**: 系统 MUST 在用户提交问题后显示加载状态
- **FR-003**: 系统 MUST 在结果返回后显示文本解释内容
- **FR-004**: 系统 MUST 在沙箱环境中渲染生成的可视化组件代码
- **FR-005**: 系统 MUST 在渲染失败时显示友好的错误提示
- **FR-006**: 系统 MUST 支持用户与渲染的组件进行交互（如拖动滑块、点击按钮）
- **FR-007**: 系统 MUST 在输入为空时阻止提交并提示用户
- **FR-017**: 系统 MUST 保持输入框在结果显示时依然可见（Split View 或 Sticky），以便用户快速修改 Prompt

#### 后端功能

- **FR-008**: 系统 MUST 提供接口接收用户问题并返回生成结果
- **FR-009**: 系统 MUST 调用大模型生成响应内容
- **FR-010**: 系统 MUST 要求大模型返回包含文本解释和可执行代码的结构化数据，**并使用 LLM 提供商的 JSON Mode/Function Calling 确保格式严格合规**
- **FR-011**: 系统 MUST 验证生成的数据格式是否正确
- **FR-018**: 系统 MUST 在 JSON 解析或验证失败时自动重试（至少 1 次，至多 3 次），仅在所有重试失败后返回错误
- **FR-012**: 系统 MUST 在解析失败且耗尽重试次数时返回明确的错误信息
- **FR-013**: 系统 MUST 通过安全方式加载敏感配置，禁止硬编码

#### 生成内容约束

- **FR-014**: 生成的可视化代码 MUST 包含一个可独立运行的组件
- **FR-015**: 生成的代码 MUST 使用预设的样式方案进行界面美化
- **FR-016**: 生成的代码 SHOULD 使用预装的可视化库（图表、动画、图标、数学计算）
- **FR-019**: 系统 MUST 为抽象或非量化查询提供通用可视化兜底策略（如概念图、流程图），而非返回纯文本或错误

### Key Entities

- **Prompt**: 用户输入的自然语言问题，包含问题文本
- **GenerationResult**: 系统生成的结果，包含文本解释和可执行代码
- **RenderState**: 前端渲染状态，包括空闲、加载中、成功、错误四种状态

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户从输入问题到看到可视化结果的完整流程可在 30 秒内完成（不含大模型响应时间）
- **SC-002**: 90% 的有效问题能够成功生成可渲染的可视化组件
- **SC-003**: 用户能够在 3 次点击内完成"输入问题 → 查看结果"的核心流程
- **SC-004**: 系统在网络错误或生成失败时 100% 显示友好错误提示，无白屏或崩溃
- **SC-005**: 生成的可视化组件支持至少一种用户交互方式（滑块、按钮等）
- **SC-006**: 首页加载时间不超过 3 秒

---

## Assumptions

- 用户主要使用桌面端浏览器访问，移动端适配为低优先级
- 大模型服务稳定可用，响应时间在可接受范围内
- 用户输入的问题以中文或英文为主
- MVP 阶段不需要用户登录、历史记录或多轮对话功能
- 沙箱环境能够正确渲染符合规范的组件代码
- **安全依赖**: 系统安全性依赖前端 Sandpack 的 iframe 隔离机制，后端不进行代码静态分析

---

## Out of Scope (MVP)

- 用户账户系统与身份认证
- 对话历史记录与持久化存储
- 多轮对话上下文记忆
- 移动端完美适配
- 流式响应
- 代码自动修复机制（后续迭代）
- **后端静态代码分析与清洗**
