# 前端测试实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 mmcp 前端建立完整测试体系，覆盖单元测试、集成测试、E2E 测试和视觉回归测试。

**Architecture:** 使用 Vitest 处理单元和集成测试，Playwright 处理 E2E 和视觉回归。MSW 模拟 API 请求。测试文件放在 `__tests__/` 目录。

**Tech Stack:** Vitest, @testing-library/react, MSW, Playwright, jsdom

---

## Task 1: 安装测试依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装 Vitest 相关依赖**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm install -D vitest @vitest/coverage-v8 jsdom
```

Expected: 依赖安装成功

**Step 2: 安装 React Testing Library**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm install -D @testing-library/react @testing-library/dom @testing-library/jest-dom
```

Expected: 依赖安装成功

**Step 3: 安装 MSW**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm install -D msw
```

Expected: 依赖安装成功

**Step 4: 安装 Playwright**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm install -D @playwright/test && npx playwright install chromium
```

Expected: Playwright 和 Chromium 浏览器安装成功

**Step 5: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add package.json package-lock.json && git commit -m "chore: add testing dependencies (vitest, playwright, msw)"
```

---

## Task 2: 配置 Vitest

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/vitest.setup.ts`
- Modify: `frontend/package.json` (添加 scripts)

**Step 1: 创建 vitest.config.ts**

Create `frontend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/unit/**/*.test.{ts,tsx}', '__tests__/integration/**/*.test.{ts,tsx}'],
    exclude: ['__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/types/**', 'src/app/layout.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: 安装 @vitejs/plugin-react**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm install -D @vitejs/plugin-react
```

**Step 3: 创建 vitest.setup.ts**

Create `frontend/vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 每个测试后清理 React 组件
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

**Step 4: 添加 npm scripts**

Modify `frontend/package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/build-runtime.mjs && next build",
    "build:runtime": "node scripts/build-runtime.mjs",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 5: 验证配置**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run
```

Expected: 输出 "No test files found" (因为还没有测试文件)

**Step 6: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add vitest.config.ts vitest.setup.ts package.json && git commit -m "chore: configure vitest for unit and integration tests"
```

---

## Task 3: 配置 Playwright

**Files:**
- Create: `frontend/playwright.config.ts`
- Modify: `frontend/package.json` (添加 scripts)
- Modify: `frontend/.gitignore`

**Step 1: 创建 playwright.config.ts**

Create `frontend/playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 2: 添加 npm scripts**

Modify `frontend/package.json` scripts (追加):
```json
{
  "scripts": {
    "test:e2e": "playwright test --project=e2e",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "playwright test --project=visual",
    "test:visual:update": "playwright test --project=visual --update-snapshots"
  }
}
```

**Step 3: 更新 .gitignore**

Append to `frontend/.gitignore`:
```
# Playwright
playwright-report/
test-results/
__tests__/e2e/visual/screenshots/
```

**Step 4: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add playwright.config.ts package.json .gitignore && git commit -m "chore: configure playwright for e2e and visual regression tests"
```

---

## Task 4: 创建测试目录结构和 MSW Mock

**Files:**
- Create: `frontend/__tests__/mocks/handlers.ts`
- Create: `frontend/__tests__/mocks/server.ts`

**Step 1: 创建目录结构**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && mkdir -p __tests__/{unit/{components/renderer,hooks,services,lib},integration,e2e,mocks}
```

**Step 2: 创建 MSW handlers**

Create `frontend/__tests__/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8000'

export const handlers = [
  // 成功响应
  http.post(`${API_BASE}/api/v1/chat/generate`, async ({ request }) => {
    const body = await request.json() as { messages: Array<{ content: string }> }
    const userMessage = body.messages[body.messages.length - 1]?.content || ''

    return HttpResponse.json({
      message: {
        role: 'assistant',
        content: `这是对 "${userMessage}" 的回复`,
        code: `export default function App() {\n  return <div>Hello World</div>\n}`,
      },
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    })
  }),
]

// 错误场景 handlers
export const errorHandlers = {
  networkError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.error()
  }),

  serverError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.json(
      { detail: '服务器内部错误' },
      { status: 500 }
    )
  }),

  validationError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.json(
      { detail: '代码验证失败' },
      { status: 422 }
    )
  }),
}
```

**Step 3: 创建 MSW server**

Create `frontend/__tests__/mocks/server.ts`:
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**Step 4: 更新 vitest.setup.ts 启动 MSW**

Modify `frontend/vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './__tests__/mocks/server'

// 启动 MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

**Step 5: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__ vitest.setup.ts && git commit -m "chore: add MSW mocks and test directory structure"
```

---

## Task 5: 单元测试 - utils.ts

**Files:**
- Create: `frontend/__tests__/unit/lib/utils.test.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/unit/lib/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className merge utility)', () => {
  it('should merge multiple class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'active', false && 'hidden')
    expect(result).toBe('base active')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should filter out falsy values', () => {
    const result = cn('foo', null, undefined, '', 'bar')
    expect(result).toBe('foo bar')
  })
})
```

**Step 2: 运行测试验证失败/通过**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/unit/lib/utils.test.ts
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/unit/lib/utils.test.ts && git commit -m "test: add unit tests for cn utility function"
```

---

## Task 6: 单元测试 - storage.ts

**Files:**
- Create: `frontend/__tests__/unit/lib/storage.test.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/unit/lib/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getConversations,
  saveConversation,
  getConversationById,
  deleteConversation,
  clearAllConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  generateConversationId,
  generateMessageId,
} from '@/lib/storage'
import type { Conversation } from '@/types/conversation'

const mockConversation: Conversation = {
  id: 'conv_123',
  title: '测试对话',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  currentVisual: null,
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getConversations', () => {
    it('should return empty array when no conversations', () => {
      expect(getConversations()).toEqual([])
    })

    it('should return saved conversations', () => {
      saveConversation(mockConversation)
      const result = getConversations()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('conv_123')
    })
  })

  describe('saveConversation', () => {
    it('should save new conversation', () => {
      saveConversation(mockConversation)
      const result = getConversationById('conv_123')
      expect(result).not.toBeNull()
      expect(result?.title).toBe('测试对话')
    })

    it('should update existing conversation', () => {
      saveConversation(mockConversation)
      saveConversation({ ...mockConversation, title: '更新后的标题' })
      const result = getConversations()
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('更新后的标题')
    })
  })

  describe('getConversationById', () => {
    it('should return null for non-existent id', () => {
      expect(getConversationById('non-existent')).toBeNull()
    })

    it('should return conversation by id', () => {
      saveConversation(mockConversation)
      const result = getConversationById('conv_123')
      expect(result?.id).toBe('conv_123')
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation by id', () => {
      saveConversation(mockConversation)
      deleteConversation('conv_123')
      expect(getConversationById('conv_123')).toBeNull()
    })
  })

  describe('clearAllConversations', () => {
    it('should clear all conversations', () => {
      saveConversation(mockConversation)
      saveConversation({ ...mockConversation, id: 'conv_456' })
      clearAllConversations()
      expect(getConversations()).toEqual([])
    })
  })

  describe('currentConversationId', () => {
    it('should get and set current conversation id', () => {
      expect(getCurrentConversationId()).toBeNull()
      setCurrentConversationId('conv_123')
      expect(getCurrentConversationId()).toBe('conv_123')
    })

    it('should clear current id when set to null', () => {
      setCurrentConversationId('conv_123')
      setCurrentConversationId(null)
      expect(getCurrentConversationId()).toBeNull()
    })
  })

  describe('id generators', () => {
    it('should generate unique conversation ids', () => {
      const id1 = generateConversationId()
      const id2 = generateConversationId()
      expect(id1).toMatch(/^conv_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique message ids', () => {
      const id1 = generateMessageId()
      const id2 = generateMessageId()
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/unit/lib/storage.test.ts
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/unit/lib/storage.test.ts && git commit -m "test: add unit tests for storage utilities"
```

---

## Task 7: 单元测试 - CompilerService.ts

**Files:**
- Create: `frontend/__tests__/unit/components/renderer/CompilerService.test.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/unit/components/renderer/CompilerService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { compileCode } from '@/components/renderer/CompilerService'

describe('CompilerService', () => {
  describe('compileCode', () => {
    it('should compile valid JSX code', () => {
      const code = `
        function App() {
          return <div>Hello World</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('React.createElement')
      expect(result.error).toBeUndefined()
    })

    it('should compile export default function', () => {
      const code = `
        export default function MyComponent() {
          return <div>Test</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('MyComponent')
    })

    it('should compile TSX with type annotations', () => {
      const code = `
        interface Props {
          name: string
        }
        function App({ name }: Props) {
          return <div>Hello {name}</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).not.toContain('interface')
      expect(result.code).not.toContain(': Props')
    })

    it('should remove import statements', () => {
      const code = `
        import React from 'react'
        import { useState } from 'react'

        function App() {
          const [count, setCount] = useState(0)
          return <div>{count}</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).not.toContain('import')
    })

    it('should return error for invalid JSX', () => {
      const code = `
        function App() {
          return <div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.code).toBeUndefined()
    })

    it('should handle arrow function components', () => {
      const code = `
        const App = () => {
          return <div>Arrow Component</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('App')
    })

    it('should handle useState hook', () => {
      const code = `
        function Counter() {
          const [count, setCount] = useState(0)
          return (
            <button onClick={() => setCount(count + 1)}>
              Count: {count}
            </button>
          )
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('useState')
    })

    it('should wrap code in executable IIFE', () => {
      const code = `
        function App() {
          return <div>Test</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('(function()')
      expect(result.code).toContain('window.React')
      expect(result.code).toContain('ReactDOM.createRoot')
    })
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/unit/components/renderer/CompilerService.test.ts
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/unit/components/renderer/CompilerService.test.ts && git commit -m "test: add unit tests for CompilerService"
```

---

## Task 8: 单元测试 - api.ts

**Files:**
- Create: `frontend/__tests__/unit/services/api.test.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/unit/services/api.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { server } from '../../mocks/server'
import { errorHandlers } from '../../mocks/handlers'
import { chatGenerate, ApiError } from '@/services/api'

describe('api service', () => {
  describe('chatGenerate', () => {
    it('should return response on success', async () => {
      const result = await chatGenerate({
        messages: [{ role: 'user', content: '画一个圆' }],
      })

      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toContain('画一个圆')
      expect(result.message.code).toBeDefined()
      expect(result.usage).toBeDefined()
    })

    it('should throw ApiError on server error', async () => {
      server.use(errorHandlers.serverError)

      await expect(
        chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
      ).rejects.toThrow(ApiError)
    })

    it('should throw ApiError with status on validation error', async () => {
      server.use(errorHandlers.validationError)

      try {
        await chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(422)
      }
    })

    it('should throw ApiError on network error', async () => {
      server.use(errorHandlers.networkError)

      await expect(
        chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
      ).rejects.toThrow(ApiError)
    })
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/unit/services/api.test.ts
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/unit/services/api.test.ts && git commit -m "test: add unit tests for API service"
```

---

## Task 9: 单元测试 - useConversation Hook

**Files:**
- Create: `frontend/__tests__/unit/hooks/use-conversation.test.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/unit/hooks/use-conversation.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversation } from '@/hooks/use-conversation'

describe('useConversation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with null conversation', () => {
    const { result } = renderHook(() => useConversation())
    // 初始时会创建新对话
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should start new chat', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    const initialId = result.current.conversation?.id

    act(() => {
      result.current.startNewChat()
    })

    expect(result.current.conversation?.id).not.toBe(initialId)
    expect(result.current.conversation?.messages).toEqual([])
  })

  it('should send message and receive response', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('画一个圆')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    expect(result.current.conversation?.messages[0].role).toBe('user')
    expect(result.current.conversation?.messages[0].content).toBe('画一个圆')
    expect(result.current.conversation?.messages[1].role).toBe('assistant')
  })

  it('should set loading state while sending', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    let loadingDuringRequest = false

    const sendPromise = act(async () => {
      const promise = result.current.sendMessage('test')
      // 检查发送过程中 isLoading 状态
      await new Promise(resolve => setTimeout(resolve, 0))
      loadingDuringRequest = result.current.isLoading
      await promise
    })

    await sendPromise

    expect(loadingDuringRequest).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should update conversation title from first message', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('这是一个很长的消息用来测试标题截断功能')
    })

    await waitFor(() => {
      expect(result.current.conversation?.title).toContain('这是一个很长的消息')
    })
  })

  it('should clear error', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/unit/hooks/use-conversation.test.ts
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/unit/hooks/use-conversation.test.ts && git commit -m "test: add unit tests for useConversation hook"
```

---

## Task 10: 集成测试 - 完整对话流程

**Files:**
- Create: `frontend/__tests__/integration/conversation-flow.test.tsx`

**Step 1: 编写测试**

Create `frontend/__tests__/integration/conversation-flow.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversation } from '@/hooks/use-conversation'
import { getConversations, getConversationById } from '@/lib/storage'

describe('Conversation Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should complete full conversation flow', async () => {
    const { result } = renderHook(() => useConversation())

    // 1. 等待初始化
    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    const conversationId = result.current.conversation!.id

    // 2. 发送第一条消息
    await act(async () => {
      await result.current.sendMessage('画一个红色的圆')
    })

    // 3. 验证消息和可视化状态
    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
      expect(result.current.conversation?.currentVisual?.status).toBe('success')
      expect(result.current.conversation?.currentVisual?.code).toBeTruthy()
    })

    // 4. 验证持久化
    const savedConversation = getConversationById(conversationId)
    expect(savedConversation).not.toBeNull()
    expect(savedConversation?.messages).toHaveLength(2)

    // 5. 发送第二条消息（多轮对话）
    await act(async () => {
      await result.current.sendMessage('改成蓝色')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(4)
      expect(result.current.conversation?.currentVisual?.version).toBe(2)
    })
  })

  it('should persist and restore conversations', async () => {
    // 1. 创建并保存对话
    const { result: result1, unmount } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result1.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result1.current.sendMessage('测试消息')
    })

    await waitFor(() => {
      expect(result1.current.conversation?.messages).toHaveLength(2)
    })

    const savedId = result1.current.conversation!.id
    unmount()

    // 2. 重新挂载，验证恢复
    const { result: result2 } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result2.current.conversation?.id).toBe(savedId)
      expect(result2.current.conversation?.messages).toHaveLength(2)
    })
  })

  it('should manage multiple conversations', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // 创建第一个对话
    await act(async () => {
      await result.current.sendMessage('对话1')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    const firstId = result.current.conversation!.id

    // 创建第二个对话
    act(() => {
      result.current.startNewChat()
    })

    await act(async () => {
      await result.current.sendMessage('对话2')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2)
    })

    // 切换回第一个对话
    act(() => {
      result.current.loadConversation(firstId)
    })

    expect(result.current.conversation?.messages[0].content).toBe('对话1')
  })

  it('should delete conversation', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('将被删除')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1)
    })

    const idToDelete = result.current.conversation!.id

    act(() => {
      result.current.deleteConversation(idToDelete)
    })

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.conversation?.id).not.toBe(idToDelete)
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run -- __tests__/integration/conversation-flow.test.tsx
```

Expected: 所有测试通过

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/integration/conversation-flow.test.tsx && git commit -m "test: add integration tests for conversation flow"
```

---

## Task 11: E2E 测试 - 用户交互流程

**Files:**
- Create: `frontend/__tests__/e2e/chat.spec.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/e2e/chat.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display empty state on first visit', async ({ page }) => {
    await page.goto('/')

    // 验证页面加载
    await expect(page).toHaveTitle(/.*/)

    // 验证输入框存在
    const input = page.locator('textarea, input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('should send message and display response', async ({ page }) => {
    await page.goto('/')

    // 找到输入框并输入
    const input = page.locator('textarea, input[type="text"]').first()
    await input.fill('画一个简单的计数器')

    // 发送消息（按回车或点击发送按钮）
    await input.press('Enter')

    // 等待用户消息显示
    await expect(page.getByText('画一个简单的计数器')).toBeVisible({ timeout: 5000 })

    // 等待 loading 状态（可选，取决于 UI 实现）
    // await expect(page.locator('.loading-indicator')).toBeVisible()

    // 等待响应（这里会调用真实 API 或被 mock）
    // 注意: E2E 测试可能需要启动后端或使用 Playwright 的路由拦截
  })

  test('should show input area', async ({ page }) => {
    await page.goto('/')

    // 验证输入区域的基本元素
    const inputArea = page.locator('textarea, input[type="text"]').first()
    await expect(inputArea).toBeVisible()
    await expect(inputArea).toBeEnabled()
  })
})
```

**Step 2: 运行测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:e2e
```

Expected: 测试运行（可能部分失败，取决于后端是否运行）

**Step 3: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/e2e/chat.spec.ts && git commit -m "test: add E2E tests for chat flow"
```

---

## Task 12: 视觉回归测试

**Files:**
- Create: `frontend/__tests__/e2e/visual.spec.ts`

**Step 1: 编写测试**

Create `frontend/__tests__/e2e/visual.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('homepage empty state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 等待页面稳定
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-empty.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('input area focused', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('textarea, input[type="text"]').first()
    await input.focus()

    await expect(input).toHaveScreenshot('input-focused.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })
})
```

**Step 2: 生成基准截图**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:visual -- --update-snapshots
```

Expected: 生成基准截图

**Step 3: 运行视觉回归测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:visual
```

Expected: 测试通过

**Step 4: 提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add __tests__/e2e/visual.spec.ts && git commit -m "test: add visual regression tests"
```

---

## Task 13: 运行完整测试套件并验证覆盖率

**Step 1: 运行所有单元和集成测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:run
```

Expected: 所有测试通过

**Step 2: 检查覆盖率**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:coverage
```

Expected: 关键路径文件覆盖率接近 100%

**Step 3: 运行 E2E 测试**

Run:
```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && npm run test:e2e
```

**Step 4: 最终提交**

```bash
cd /Users/k1he/Desktop/01-开发项目/mmcp/frontend && git add -A && git commit -m "test: complete frontend testing setup"
```

---

## 测试文件清单

| 文件 | 类型 | 覆盖目标 |
|-----|------|---------|
| `__tests__/unit/lib/utils.test.ts` | 单元 | cn() 函数 |
| `__tests__/unit/lib/storage.test.ts` | 单元 | LocalStorage 操作 |
| `__tests__/unit/components/renderer/CompilerService.test.ts` | 单元 | JSX/TSX 编译 |
| `__tests__/unit/services/api.test.ts` | 单元 | API 调用 |
| `__tests__/unit/hooks/use-conversation.test.ts` | 单元 | 对话 Hook |
| `__tests__/integration/conversation-flow.test.tsx` | 集成 | 完整对话流程 |
| `__tests__/e2e/chat.spec.ts` | E2E | 用户交互 |
| `__tests__/e2e/visual.spec.ts` | 视觉 | 关键页面截图 |
| `__tests__/mocks/handlers.ts` | Mock | API 响应 |
| `__tests__/mocks/server.ts` | Mock | MSW 服务器 |
