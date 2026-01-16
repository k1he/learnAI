# 前端测试方案设计

## 概述

为 mmcp 前端项目建立完整的测试体系，保障可交付产物的质量。

**测试范围**：全覆盖（单元、集成、E2E、视觉回归）
**工具选型**：Vitest + Playwright
**覆盖率目标**：关键路径 100%
**CI/CD**：先本地跑通，后续再集成
**视觉截图管理**：仅本地存储，不提交 Git

---

## 1. 测试架构

```
frontend/
├── __tests__/
│   ├── unit/                     # 单元测试
│   │   ├── components/
│   │   │   └── renderer/
│   │   │       └── CompilerService.test.ts
│   │   ├── hooks/
│   │   │   └── use-conversation.test.ts
│   │   ├── services/
│   │   │   └── api.test.ts
│   │   └── lib/
│   │       ├── storage.test.ts
│   │       └── utils.test.ts
│   ├── integration/              # 集成测试
│   │   └── conversation-flow.test.tsx
│   ├── e2e/                      # E2E + 视觉回归
│   │   ├── chat.spec.ts
│   │   └── visual.spec.ts
│   └── mocks/
│       ├── handlers.ts           # MSW 请求处理器
│       └── server.ts             # MSW 服务器配置
├── vitest.config.ts
├── vitest.setup.ts               # 测试全局配置
└── playwright.config.ts
```

### 工具分工

| 测试类型 | 工具 | 覆盖范围 |
|---------|------|---------|
| 单元测试 | Vitest + React Testing Library | 组件、Hooks、工具函数、CompilerService |
| 集成测试 | Vitest + MSW | API 调用、useConversation 完整流程 |
| E2E 测试 | Playwright | 完整用户交互流程 |
| 视觉回归 | Playwright 内置截图对比 | 关键页面/组件状态 |

---

## 2. 关键路径定义

### 必须 100% 覆盖

**1. 代码编译渲染（最核心）**
- `CompilerService.compile()` - JSX/TSX 编译成功/失败
- `IframeRenderer` - 代码传递、渲染、错误捕获

**2. 对话流程**
- `useConversation` Hook - 发送消息、接收响应、状态管理
- `api.generateVisualization()` - API 调用和错误处理
- 消息历史持久化（LocalStorage）

**3. 用户交互流程（E2E）**
- 输入概念 → 发送 → 显示 loading → 渲染可视化
- 多轮对话迭代修改
- 历史对话切换

### 非关键路径（不强求）

- UI 基础组件（Button、Card 等）
- 纯样式相关代码
- Header、HistorySidebar 等展示性组件

---

## 3. 视觉回归覆盖点

| 页面/状态 | 截图场景 |
|----------|---------|
| 首页空状态 | 无对话时的初始界面 |
| 对话进行中 | 有消息 + 可视化渲染 |
| 加载状态 | AI 响应等待中 |
| 错误状态 | 编译失败/API 错误 |
| 移动端视图 | 响应式布局 |

---

## 4. 测试实现细节

### 单元测试

**CompilerService 测试**
- 编译有效 JSX 代码 → 返回编译结果
- 编译有效 TSX 代码 → 正确处理类型注解
- 编译无效代码 → 返回错误信息
- 处理 import 语句 → 正确转换为全局变量引用

**useConversation Hook 测试**
- 初始状态正确（空消息列表）
- sendMessage 触发 API 调用
- API 成功 → 更新消息列表
- API 失败 → 设置错误状态
- 消息自动持久化到 LocalStorage
- 从 LocalStorage 恢复历史

**工具函数测试**
- storage.ts: get/set/remove 正常工作，处理 JSON 解析错误
- utils.ts: cn() 正确合并类名

### 集成测试

使用 MSW 模拟后端 API：
- 用户发送消息 → Hook 调用 API → 返回代码 → 更新 UI 状态
- 多轮对话 → 消息累积正确
- API 超时 → 错误处理正确

### E2E 测试

- 访问首页 → 显示空状态界面
- 输入概念并发送 → 显示 loading → 渲染可视化
- 点击历史对话 → 切换对话内容
- 修改请求（多轮迭代）→ 更新可视化

### 视觉回归

- 每个关键状态截图对比
- 截图存储在 `__tests__/e2e/visual/screenshots/`
- `.gitignore` 忽略截图目录

---

## 5. 依赖安装

```json
{
  "devDependencies": {
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "@testing-library/react": "^16.x",
    "@testing-library/dom": "^10.x",
    "jsdom": "^26.x",
    "msw": "^2.x",
    "@playwright/test": "^1.50.x"
  }
}
```

---

## 6. npm scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:visual": "playwright test --project=visual",
  "test:visual:update": "playwright test --project=visual --update-snapshots"
}
```

---

## 7. 配置文件

### vitest.config.ts

- 环境：jsdom
- 覆盖率：v8 provider
- 包含路径：`__tests__/unit/**`, `__tests__/integration/**`
- 排除：e2e 目录

### playwright.config.ts

- 两个 project：`e2e`（功能测试）和 `visual`（视觉回归）
- baseURL：`http://localhost:3000`
- 截图输出目录：`__tests__/e2e/visual/screenshots/`
- webServer 配置：自动启动 `npm run dev`

### .gitignore 更新

```
# 视觉回归截图（本地存储）
__tests__/e2e/visual/screenshots/
playwright-report/
test-results/
```

---

## 8. 使用方式

### 日常开发

```bash
# 开发时：监听模式运行单元/集成测试
npm test

# 提交前：运行完整测试套件
npm run test:run && npm run test:e2e

# 检查覆盖率
npm run test:coverage
```

### 视觉回归工作流

```bash
# 首次运行：生成基准截图
npm run test:visual

# 后续运行：对比截图，不一致则失败
npm run test:visual

# UI 有意改动后：更新基准截图
npm run test:visual:update
```

### 调试测试

```bash
# Vitest UI 模式
npx vitest --ui

# Playwright UI 模式
npm run test:e2e:ui

# Playwright 指定测试文件
npx playwright test chat.spec.ts
```

---

## 9. 测试文件清单

| 类型 | 文件 | 覆盖目标 |
|-----|------|---------|
| 单元测试 | `CompilerService.test.ts` | 代码编译 |
| 单元测试 | `use-conversation.test.ts` | 对话 Hook |
| 单元测试 | `api.test.ts` | API 服务 |
| 单元测试 | `storage.test.ts` | LocalStorage |
| 单元测试 | `utils.test.ts` | 工具函数 |
| 集成测试 | `conversation-flow.test.tsx` | 完整对话流程 |
| E2E 测试 | `chat.spec.ts` | 用户交互 |
| 视觉回归 | `visual.spec.ts` | 5 个关键状态 |
| Mock | `handlers.ts` | API Mock |
| Mock | `server.ts` | MSW 服务器 |
