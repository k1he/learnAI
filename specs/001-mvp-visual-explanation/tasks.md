# Tasks: MVP 生成式可视化解释工具

**Input**: Design documents from `/specs/001-mvp-visual-explanation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: 未明确请求，本任务列表不包含测试任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）
- 描述中包含精确文件路径

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基本结构搭建

- [x] T001 Create backend project structure: `backend/app/api/`, `backend/app/core/`, `backend/app/schemas/`, `backend/app/services/`
- [x] T002 [P] Create `backend/requirements.txt` with dependencies: fastapi, uvicorn, pydantic, openai, python-dotenv
- [x] T003 [P] Create `backend/.env.example` with LLM_API_KEY and LLM_BASE_URL placeholders
- [x] T004 [P] Initialize frontend Next.js project structure verification in `frontend/`
- [x] T005 [P] Install frontend dependencies: `@codesandbox/sandpack-react`, `react-resizable-panels`, `lucide-react` in `frontend/package.json`

---

## Phase 2: Foundational (阻塞性前置任务)

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: 此阶段完成前，用户故事无法开始

- [x] T006 Create config module with Settings class in `backend/app/core/config.py` (load LLM_API_KEY, LLM_BASE_URL from env)
- [x] T007 [P] Create LLM client factory in `backend/app/core/llm_client.py` (AsyncOpenAI with custom base_url)
- [x] T008 [P] Create Pydantic schemas: GenerationRequest, GeneratedContent, GenerationResponse in `backend/app/schemas/generation.py`
- [x] T009 Create FastAPI app entrypoint with CORS middleware in `backend/app/main.py`
- [x] T010 [P] Create API client utility in `frontend/src/lib/api.ts` (fetch wrapper for /api/generate)
- [x] T011 [P] Create TypeScript interfaces: GenerationRequest, GenerationResponse, GeneratedContent in `frontend/src/types/api.ts`
- [x] T012 [P] Setup Shadcn/UI base components (Button, Input, Card) in `frontend/src/components/ui/`

**Checkpoint**: 基础设施就绪 - 用户故事可以开始并行实现

---

## Phase 3: User Story 1 - 输入问题获得可视化解释 (Priority: P1) 🎯 MVP

**Goal**: 用户输入自然语言问题，系统生成可交互的可视化组件并实时渲染

**Independent Test**: 输入"展示正弦波"，验证是否显示可交互图表

### Implementation for User Story 1

- [x] T013 [US1] Create system prompt template for LLM (JSON mode, React component generation) in `backend/app/services/prompts.py`
- [x] T014 [US1] Implement LLMService with generate method (JSON mode, response parsing) in `backend/app/services/llm_service.py`
- [x] T015 [US1] Implement code validation utility (check export default) in `backend/app/services/code_validator.py`
- [x] T016 [US1] Create `/api/generate` endpoint in `backend/app/api/v1/generate.py`
- [x] T017 [US1] Register API router in `backend/app/main.py`
- [x] T018 [P] [US1] Create SandpackPreview component (wrapper for Sandpack with pre-installed deps) in `frontend/src/components/visualization/SandpackPreview.tsx`
- [x] T019 [P] [US1] Create SplitView layout component (ResizablePanel) in `frontend/src/components/visualization/SplitView.tsx`
- [x] T020 [US1] Create PromptInput component (textarea with submit button) in `frontend/src/components/PromptInput.tsx`
- [x] T021 [US1] Implement main page with state management (prompt, result, isLoading) in `frontend/src/app/page.tsx`
- [x] T022 [US1] Wire up API call and render SandpackPreview with generated code in `frontend/src/app/page.tsx`

**Checkpoint**: User Story 1 完成 - 核心功能可独立测试

---

## Phase 4: User Story 2 - 查看文本解释 (Priority: P1)

**Goal**: 用户在获得可视化结果的同时，能够阅读简洁的文字解释

**Independent Test**: 验证每次生成结果都包含非空的文本解释内容

### Implementation for User Story 2

- [x] T023 [US2] Create ExplanationPanel component (markdown/text display) in `frontend/src/components/visualization/ExplanationPanel.tsx`
- [x] T024 [US2] Integrate ExplanationPanel into SplitView layout in `frontend/src/app/page.tsx`
- [x] T025 [US2] Ensure LLM prompt includes instruction for clear explanation in `backend/app/services/prompts.py`

**Checkpoint**: User Story 2 完成 - 文本解释与可视化同步显示

---

## Phase 5: User Story 3 - 错误处理与反馈 (Priority: P2)

**Goal**: 系统无法生成有效结果时，用户能看到友好的错误提示并可重试

**Independent Test**: 模拟错误场景（断网、无效输入）验证错误提示是否正确显示

### Implementation for User Story 3

- [x] T026 [US3] Implement auto-retry logic (max 3 retries) for JSON parsing failures in `backend/app/services/llm_service.py`
- [x] T027 [US3] Create standardized error response format in `backend/app/schemas/generation.py`
- [x] T028 [P] [US3] Create ErrorDisplay component (friendly error message with retry button) in `frontend/src/components/ErrorDisplay.tsx`
- [x] T029 [US3] Add error state handling and retry functionality in `frontend/src/app/page.tsx`
- [x] T030 [US3] Handle network errors and API failures gracefully in `frontend/src/lib/api.ts`
- [x] T031 [US3] Add input validation (empty input, max length) in `frontend/src/components/PromptInput.tsx`

**Checkpoint**: User Story 3 完成 - 错误处理机制可独立测试

---

## Phase 6: User Story 4 - 加载状态反馈 (Priority: P2)

**Goal**: 等待大模型生成结果期间，用户能够看到明确的加载状态

**Independent Test**: 验证提交问题后立即显示加载指示器，结果返回后消失

### Implementation for User Story 4

- [x] T032 [P] [US4] Create LoadingIndicator component (spinner/skeleton) in `frontend/src/components/LoadingIndicator.tsx`
- [x] T033 [US4] Integrate loading state display in main page in `frontend/src/app/page.tsx`
- [x] T034 [US4] Disable submit button during loading to prevent duplicate requests in `frontend/src/components/PromptInput.tsx`

**Checkpoint**: User Story 4 完成 - 加载状态反馈可独立测试

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和优化

- [x] T035 [P] Add fallback visualization strategy for abstract queries in `backend/app/services/prompts.py`
- [x] T036 [P] Optimize Sandpack loading (defer until data received) in `frontend/src/components/visualization/SandpackPreview.tsx`
- [x] T037 [P] Add responsive layout adjustments for SplitView in `frontend/src/components/visualization/SplitView.tsx`
- [x] T038 Run quickstart.md validation (verify end-to-end flow)
- [x] T039 Code cleanup and ensure consistent error handling across all components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-6)**: 全部依赖 Foundational 完成
  - US1 和 US2 可并行（US2 依赖 US1 的 SplitView 组件）
  - US3 和 US4 可在 US1 完成后并行
- **Polish (Phase 7)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成后可开始 - 核心 MVP
- **User Story 2 (P1)**: 可与 US1 并行，但需集成到 US1 的 SplitView
- **User Story 3 (P2)**: 依赖 US1 的基本流程完成
- **User Story 4 (P2)**: 依赖 US1 的基本流程完成

### Within Each User Story

- 后端服务优先于前端组件
- 核心功能优先于增强功能
- 每个故事完成后可独立测试

### Parallel Opportunities

- T002, T003, T004, T005 可并行（Setup 阶段）
- T007, T008, T010, T011, T012 可并行（Foundational 阶段）
- T018, T019 可并行（US1 前端组件）
- T028, T032 可并行（US3/US4 组件）
- T035, T036, T037 可并行（Polish 阶段）

---

## Parallel Example: Foundational Phase

```bash
# 并行启动所有独立的 Foundational 任务:
Task: "Create LLM client factory in backend/app/core/llm_client.py"
Task: "Create Pydantic schemas in backend/app/schemas/generation.py"
Task: "Create API client utility in frontend/src/lib/api.ts"
Task: "Create TypeScript interfaces in frontend/src/types/api.ts"
Task: "Setup Shadcn/UI base components in frontend/src/components/ui/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 输入"展示正弦波"测试核心流程
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪
2. User Story 1 → 独立测试 → Deploy/Demo (MVP!)
3. User Story 2 → 独立测试 → 文本解释功能上线
4. User Story 3 → 独立测试 → 错误处理完善
5. User Story 4 → 独立测试 → 加载体验优化
6. 每个故事增加价值而不破坏之前的功能

---

## Notes

- [P] 任务 = 不同文件，无依赖
- [Story] 标签将任务映射到特定用户故事以便追踪
- 每个用户故事应可独立完成和测试
- 每个任务或逻辑组完成后提交
- 在任何检查点停下来验证故事独立性
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
