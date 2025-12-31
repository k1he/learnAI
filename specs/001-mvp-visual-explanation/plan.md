# Implementation Plan: MVP 生成式可视化解释工具

**Branch**: `001-mvp-visual-explanation` | **Date**: 2025-12-31 | **Spec**: [specs/001-mvp-visual-explanation/spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-mvp-visual-explanation/spec.md`

## Summary

实现一个基于大模型的生成式可视化解释工具。用户输入自然语言问题，后端调用 LLM 生成文本解释和 React 组件代码，前端通过 Sandpack 沙箱实时渲染。核心特性包括 Split View 界面、严格的 JSON 格式强制、自动重试机制以及无数据库的轻量级架构。

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5.0+ (Frontend)
**Primary Dependencies**: 
- Backend: FastAPI, Uvicorn, Pydantic, OpenAI SDK (compatible with DeepSeek/Qwen)
- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn/UI, @codesandbox/sandpack-react
**Storage**: None / In-Memory (MVP does not require persistence)
**Testing**: pytest + httpx (Backend), Jest + React Testing Library (Frontend)
**Target Platform**: Linux (Containerized Backend), Modern Web Browsers (Frontend)
**Project Type**: Web application (Client-Server Monorepo)
**Performance Goals**: API P95 < 100ms (excluding LLM latency), FCP < 1.5s, Lighthouse score >= 90
**Constraints**: No database persistence, Stateless backend, strict security via iframe isolation
**Scale/Scope**: MVP scope, single user session focus

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status | Notes |
|-----------|-------|--------|-------|
| **1. Performance First** | Frontend optimization | ⚠️ Pending | Need to research Sandpack dependency pre-loading to meet FCP goals. |
| **2. Test-Driven Development** | Coverage requirements | ✅ Pass | Plan includes setup for pytest and Jest coverage enforcing. |
| **3. Design Pattern Compliance** | SOLID & Patterns | ✅ Pass | Architecture follows Separation of Concerns; Factory pattern for LLM client planned. |
| **4. Separation of Concerns** | API Contract | ✅ Pass | Clear separation between Next.js frontend and FastAPI backend. |
| **5. Security by Default** | Input validation | ✅ Pass | Pydantic for validation; Sandpack for code isolation. |
| **6. Code Quality** | Tooling | ✅ Pass | ESLint, Prettier, Ruff, Black included in tech stack. |

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-visual-explanation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/            # API Endpoints (v1/generate)
│   ├── core/           # Config, Logging, LLM Client Factory
│   ├── schemas/        # Pydantic Models (Request/Response)
│   ├── services/       # LLM Service, Code Extraction/Validation
│   └── main.py         # App Entrypoint
└── tests/
    ├── integration/    # API tests
    └── unit/           # Service unit tests

frontend/
├── src/
│   ├── app/            # Next.js Pages (page.tsx, layout.tsx)
│   ├── components/     # UI Components
│   │   ├── visualization/ # Sandpack wrapper, SplitView layout
│   │   └── ui/         # Shadcn atoms
│   ├── lib/            # Utilities (API client)
│   └── types/          # Shared TS interfaces
└── tests/              # Frontend tests
```

**Structure Decision**: Standard Monorepo with separated Frontend/Backend directories as defined in Architecture.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
