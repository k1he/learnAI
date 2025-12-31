# Research Findings

**Feature**: 002-pro-ui-conversational
**Date**: 2025-12-31

## 1. AST Validation for Generated Frontend Code (Python Backend)

**Context**: The backend (Python) needs to validate generated React/TypeScript code to ensure it only imports allowed libraries before sending it to the client.

**Problem**: Python's built-in `ast` module parses Python, not JavaScript/TypeScript.

**Options Considered**:
1.  **Regex-based Analysis**: Use strong regex patterns to find `import ... from '...'` statements.
    *   *Pros*: Zero external dependencies, fast, sufficient for import blocking.
    *   *Cons*: Can be tricked by complex comments or strings (though less likely in LLM output if instructed well).
2.  **JavaScript Parser (e.g., `esprima-python`)**:
    *   *Pros*: True AST parsing.
    *   *Cons*: Adds heavy dependencies, may be outdated or slow.
3.  **Node.js Sidecar**: Call out to a Node script.
    *   *Pros*: Perfect parsing.
    *   *Cons*: Violates "Performance First" (overhead), adds deployment complexity.

**Decision**: **Regex-based Static Analysis**.
**Rationale**: Given the constraint of "Performance First" and the specific need to just check imports (not execute logic), a carefully crafted regex targeting `import` statements is sufficient and performant. We will combine this with a "System Prompt" that strictly formats imports.

**Implementation Detail**:
```python
import re
ALLOWED_MODULES = {'react', 'recharts', 'lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'}

def validate_imports(code: str) -> list[str]:
    # Regex to capture module names in imports
    pattern = r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]"
    imports = re.findall(pattern, code)
    forbidden = [m for m in imports if m not in ALLOWED_MODULES]
    return forbidden
```

## 2. Conversation Context Strategy

**Context**: We need to pass conversation history to the LLM to support iterative edits ("Make it blue").

**Options Considered**:
1.  **Full History (Naive)**: Append all messages.
    *   *Cons*: Quickly hits token limits.
2.  **Summarization**: Use an intermediate LLM call to summarize history.
    *   *Cons*: Increases latency (2x LLM calls), contradicts "Performance First".
3.  **Sliding Window with Code Snapshot**: `[System, Initial_Code_Snapshot, ...Recent_Messages]`.

**Decision**: **Sliding Window + Last Valid Code**.
**Rationale**: The LLM needs the *current state* of the code to modify it. History of *how* we got there is less important than the *result*.
**Structure**:
- `System Prompt`: Instructions + Allowed Libs.
- `User`: "Current Code Context: ```...```" (Hidden from user, inserted by backend).
- `User`: Actual user prompt ("Make it red").

## 3. Split Screen Layout

**Decision**: Use `react-resizable-panels`.
**Rationale**: It is the underlying library for Shadcn/UI's Resizable component, offering accessible, keyboard-friendly, and performant resizing.

## 4. Dependencies

**Verified List**:
- `fastapi`, `pydantic`, `openai` (Backend)
- `lucide-react`, `recharts`, `framer-motion`, `clsx`, `tailwind-merge` (Frontend)
- `react-resizable-panels` (Frontend Layout)
