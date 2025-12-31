# Research & Technical Decisions

**Feature**: MVP Generative Visual Explanation
**Date**: 2025-12-31

## 1. LLM Integration Strategy

### Unknown: How to ensure OpenAI SDK compatibility with DeepSeek/Qwen?

**Decision**: Use standard `openai` Python library with custom `base_url` and `api_key`.

**Rationale**:
- DeepSeek and Qwen (via DashScope or similar) provide OpenAI-compatible APIs.
- Reduces dependency on multiple SDKs.
- Allows easy switching of models via configuration.

**Configuration Pattern**:
```python
client = AsyncOpenAI(
    api_key=settings.LLM_API_KEY,
    base_url=settings.LLM_BASE_URL
)
```

### Unknown: How to enforce Strict JSON Mode?

**Decision**: Use `response_format={"type": "json_object"}` where supported, combined with System Prompt enforcement.

**Rationale**:
- `json_object` mode guarantees valid JSON syntax.
- System prompt MUST explicitly instruct "You are a JSON generator. Output only valid JSON."
- Fallback: Pydantic validation + Auto-retry loop (as defined in Spec FR-018).

---

## 2. Frontend Sandbox Performance

### Unknown: How to optimize Sandpack loading time?

**Decision**: Use `SandpackProvider` with explicit `files` and `customSetup`.

**Rationale**:
- Pre-install dependencies list in `customSetup.dependencies` to trigger caching.
- Use `SandpackLayout` to control rendering.
- **Optimization**: Defer loading of Sandpack until data is received (show loading skeleton first).
- **Optimization**: Use a lightweight template (e.g., `react`) and avoid loading unnecessary files.

**Alternatives Considered**:
- *Self-hosted bundler*: Too complex for MVP.
- *Iframe manual setup*: Security risks and maintenance burden.

---

## 3. UI Layout Implementation

### Unknown: Best practice for Split View implementation?

**Decision**: Use `ResizablePanel` from `shadcn/ui` (wrapping `react-resizable-panels`).

**Rationale**:
- Provides native-like resizing experience.
- Fits perfectly with the project's UI library choice.
- Supports persistent layout constraints (min/max size).

**Layout Structure**:
- Left/Top Panel: Chat Input + Text Explanation (Scrollable).
- Right/Bottom Panel: Sandpack Preview (Sticky/Fixed).

---

## 4. Security Measures

### Unknown: Content Security Policy (CSP) for Sandpack?

**Decision**: Sandpack handles iframe isolation by default. We will ensure the host page does not expose sensitive cookies.

**Rationale**:
- Sandpack executes code in a separate domain (`codesandbox.io` or configured bundler).
- MVP does not have user authentication cookies to steal.
- **Action**: Ensure API keys are NOT passed to the frontend or Sandpack environment.

