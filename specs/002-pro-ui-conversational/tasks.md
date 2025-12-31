# Tasks: 002-pro-ui-conversational

**Spec**: `/specs/002-pro-ui-conversational/spec.md`
**Plan**: `/specs/002-pro-ui-conversational/plan.md`
**Phase**: Implementation

## Implementation Strategy
This feature will be implemented in a strict "Foundation First" approach, followed by vertical slices per user story. 
1. **Foundation**: Set up the backend validator and frontend state management (LocalStorage) + Layout Shell.
2. **US1 (UI Core)**: Build the responsive Split View and Sandpack integration.
3. **US2 (Logic Core)**: Connect the Chat API with the "Smart Append" context strategy.
4. **US3 (Persistence)**: Enable history saving and session management.
5. **Polish**: Enhance visual feedback (loading/errors) and styling.

---

## Phase 1: Setup
*Goal: Initialize environment and install dependencies.*

- [X] T001 Install Frontend dependencies (resizable-panels, lucide, motion, clsx, merge) in `frontend/package.json`
- [X] T002 Verify Backend dependencies (pydantic, openai) in `backend/requirements.txt`
- [X] T003 Create feature directory structure in `frontend/src/components/conversational` and `backend/app/api/v1/endpoints`

## Phase 2: Foundational
*Goal: Build shared utilities and contracts required by all user stories. Must be completed before US tasks.*

### Backend Foundation
- [X] T004 [P] Implement Pydantic schemas (ChatRequest, ChatResponse, Message) in `backend/app/schemas/conversation.py`
- [X] T005 [P] Implement Regex-based AST Validator service in `backend/app/services/validator.py`
- [X] T006 [P] Create Unit Test for AST Validator in `backend/tests/unit/test_validator.py`

### Frontend Foundation
- [X] T007 [P] Implement LocalStorage utility for Conversation persistence in `frontend/src/lib/storage.ts`
- [X] T008 [P] Define TypeScript interfaces (Conversation, Message, Visualization) in `frontend/src/types/conversation.ts`
- [X] T009 [P] Initialize Shadcn Resizable component (if not present) in `frontend/src/components/ui/resizable.tsx`

---

## Phase 3: User Story 1 - Full Screen Visual Experience (P1)
*Goal: Create the responsive split-screen layout and visualizer container.*
*Independent Test: Resize window and verify layout adapts; Mobile shows stacked view.*

- [X] T010 [US1] Create `SplitLayout` component using `ResizablePanel` in `frontend/src/components/conversational/SplitLayout.tsx`
- [X] T011 [P] [US1] Implement responsive hook `useIsMobile` in `frontend/src/hooks/use-mobile.ts`
- [X] T012 [US1] Create `VisualizerPane` component (Sandpack wrapper) in `frontend/src/components/conversational/VisualizerPane.tsx`
- [X] T013 [US1] Create `InputPane` component skeleton in `frontend/src/components/conversational/InputPane.tsx`
- [X] T014 [US1] Assemble Main Page with `SplitLayout` in `frontend/src/app/page.tsx`
- [X] T015 [US1] Add basic CSS/Tailwind styles for full-height viewport in `frontend/src/app/globals.css`

---

## Phase 4: User Story 2 - Conversational Iteration (P1)
*Goal: Enable natural language modification of visualizations.*
*Independent Test: Send "make it red", verify backend receives history and returns valid updated code.*

### Backend Implementation
- [X] T016 [US2] Implement LLM Service with "Smart Append" context strategy in `backend/app/services/llm_service.py`
- [X] T017 [US2] Create System Prompt template with allowed libraries list in `backend/app/core/prompts.py`
- [X] T018 [US2] Implement `/api/v1/chat/generate` endpoint in `backend/app/api/v1/endpoints/chat.py`
- [X] T019 [P] [US2] Create Integration Test for Chat Endpoint in `backend/tests/integration/test_chat_api.py`

### Frontend Implementation
- [X] T020 [P] [US2] Implement API Client service for chat generation in `frontend/src/services/api.ts`
- [X] T021 [US2] Create `ChatInterface` component (Message List) in `frontend/src/components/conversational/ChatInterface.tsx`
- [X] T022 [US2] Implement `useConversation` hook for state management (send message, update visual) in `frontend/src/hooks/use-conversation.ts`
- [X] T023 [US2] Integrate `ChatInterface` into `InputPane` in `frontend/src/components/conversational/InputPane.tsx`
- [X] T024 [US2] Connect `useConversation` state to `VisualizerPane` in `frontend/src/app/page.tsx`

---

## Phase 5: User Story 3 - History & Context (P2)
*Goal: Persist sessions and allow navigation between past conversations.*
*Independent Test: Refresh page, history remains. Click "New Chat", history clears.*

- [X] T025 [P] [US3] Update `useConversation` to hydrate state from `storage.ts` on mount in `frontend/src/hooks/use-conversation.ts`
- [X] T026 [US3] Create `HistorySidebar` component (Sheet/Drawer) in `frontend/src/components/conversational/HistorySidebar.tsx`
- [X] T027 [US3] Implement "New Chat" button logic in `frontend/src/components/conversational/Header.tsx`
- [X] T028 [US3] Add "Clear History" functionality in `frontend/src/lib/storage.ts`

---

## Phase 6: User Story 4 & 5 - Polish & Error Handling (P2/P3)
*Goal: Professional look and feel, robust error feedback.*

- [X] T029 [US4] Apply Shadcn Theme (Dark/Light mode) to new components in `frontend/src/components/conversational/*`
- [X] T030 [US5] Implement "Thinking..." loading state animation in `frontend/src/components/conversational/ChatInterface.tsx`
- [X] T031 [US5] Create Error Toast/Banner component for API failures in `frontend/src/components/ui/error-banner.tsx`
- [X] T032 [US5] Implement Error Boundary for Sandpack renderer in `frontend/src/components/conversational/VisualizerPane.tsx`

---

## Dependencies
- Phase 2 (Foundation) MUST be completed before Phase 3, 4, 5.
- Phase 3 (UI Layout) and Phase 4 (Logic) can be developed in parallel by separate devs, but integration (T024) requires both.
- Phase 5 (History) depends on Phase 4 (State Logic).
