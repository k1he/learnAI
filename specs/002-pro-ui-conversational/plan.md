# Implementation Plan: 商业级前端UI + 多轮对话迭代

**Branch**: `002-pro-ui-conversational` | **Date**: 2025-12-31 | **Spec**: [Feature Spec](./spec.md)
**Input**: Feature specification from `/specs/002-pro-ui-conversational/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements a professional-grade, split-screen UI for "Concept Canvas" and introduces conversational iteration capabilities. Key technical improvements include a responsive design using Shadcn/UI, client-side conversation state management via LocalStorage, and a stateless backend that supports incremental code modifications using a "Smart Append" history context strategy. Safety is enforced via backend AST validation of generated code.

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5.0+ (Frontend)
**Primary Dependencies**: 
- Backend: FastAPI, Pydantic, OpenAI SDK (DeepSeek)
- Frontend: Next.js 14+, React 18, Tailwind CSS, Shadcn/UI, @codesandbox/sandpack-react, Recharts, Framer Motion
**Storage**: Client-side LocalStorage (for Conversation History); No persistent backend database required for this iteration.
**Testing**: 
- Backend: pytest (Unit/Integration)
- Frontend: Jest (Unit), Playwright (E2E)
**Target Platform**: Modern Web Browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web Application (Monorepo: Frontend + Backend)
**Performance Goals**: 
- API Response (non-LLM): P95 < 100ms
- Frontend Animations: 60fps
- Time to Interactive: < 1.5s
**Constraints**: 
- Stateless Backend (History passed in request)
- Strict AST Validation for generated code (Security)
- Curated list of allowed npm packages
**Scale/Scope**: Single-user, browser-local sessions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle 1: Performance First**: ✅ Plan uses client-side state to minimize backend load; optimized React rendering required for split-screen resizing.
- **Principle 2: Test-Driven Development**: ✅ TDD required for AST validation logic and Redux-like state reducers on frontend.
- **Principle 3: Design Pattern Compliance**: ✅ Strategy pattern for LLM prompt construction; Observer pattern for UI state.
- **Principle 4: Separation of Concerns**: ✅ Strict API contract; Frontend handles all session state; Backend is pure compute (LLM + Validation).
- **Principle 5: Security by Default**: ✅ AST analysis implemented on backend to prevent malicious code generation.
- **Principle 6: Code Quality**: ✅ Linting and strict typing enforced across stack.

## Project Structure

### Documentation (this feature)

```text
specs/002-pro-ui-conversational/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/endpoints/  # New conversational endpoints
│   ├── core/              # Config updates
│   ├── schemas/           # Pydantic models for Conversation/Message
│   └── services/          # LLM Service updates, AST Validator
└── tests/

frontend/
├── src/
│   ├── app/               # Next.js pages (Split view layout)
│   ├── components/        # New Shadcn components, Chat interface
│   ├── lib/               # LocalStorage utils, API client
│   └── types/             # Shared TypeScript interfaces
└── tests/
```

**Structure Decision**: Standard Web Application structure with separated Frontend and Backend, consistent with existing project layout.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
