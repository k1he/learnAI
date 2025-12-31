# Concept Canvas - Architecture Documentation (MVP)

## 1. 产品愿景与范围

**Concept Canvas** 是一个“生成式可视化解释”工具。它通过自然语言对话生成动态的、可交互的前端组件，帮助用户直观理解复杂概念。

### 1.1 MVP 核心目标
- **极简体验**：无注册/登录，无历史记录持久化，即开即用。
- **核心闭环**：Prompt 输入 -> LLM 生成代码 -> 浏览器端实时渲染 (Sandpack) -> 交互体验。
- **稳定性**：后端包含基础的“生成-校验-修复”机制，确保生成的代码可运行。

### 1.2 排除范围 (Out of Scope for MVP)
- 用户账户系统与鉴权。
- 复杂的数据库存储（仅内存或临时文件）。
- 多轮对话上下文记忆（MVP 侧重单次生成质量）。
- 移动端完美适配（优先桌面端体验）。

---

## 2. 技术栈架构

项目采用 Monorepo 结构，前后端完全分离。

### 2.1 目录结构
```
mmcp/
├── docs/                   # 项目文档
├── frontend/               # Next.js 14+ (App Router)
│   ├── src/
│   │   ├── app/            # 页面路由
│   │   ├── components/     # Shadcn UI + 自定义组件
│   │   ├── lib/            # 工具函数
│   │   └── services/       # API 请求封装
├── backend/                # Python 3.12 / FastAPI
│   ├── app/
│   │   ├── main.py         # 入口
│   │   ├── api/            # 路由
│   │   ├── core/           # LLM Client, Config
│   │   └── schemas/        # Pydantic Models
├── .gitignore
└── README.md
```

### 2.2 前端 (Frontend)
- **框架**: Next.js 14+ (React 18), TypeScript.
- **样式**: Tailwind CSS.
- **组件库**: Shadcn/UI (基于 Radix UI).
- **核心引擎**: `@codesandbox/sandpack-react` (用于代码的实时编译与运行).
- **状态管理**: React Context / Zustand (轻量级).
- **HTTP Client**: Axios 或 Fetch API.

### 2.3 后端 (Backend)
- **框架**: FastAPI (高性能异步 Web 框架).
- **语言**: Python 3.12.
- **LLM 交互**: OpenAI SDK (兼容层，对接 DeepSeek / Qwen 等国内模型).
- **数据验证**: Pydantic.
- **部署**: Uvicorn / Docker (可选).

---

## 3. 数据流与交互协议

### 3.1 核心流程
1. **User Input**: 用户在前端输入自然语言 Prompt (e.g., "解释正态分布").
2. **Request**: 前端发送 `POST /api/generate` 请求给后端.
3. **Prompt Engineering**: 后端 `Generator` 模块组装 System Prompt，强制要求返回 JSON 格式：
   - `explanation`: 简短文本解释.
   - `code`: 完整的 React 组件代码 (Default Export App).
4. **LLM Generation**: 调用大模型 API.
5. **Validation & Repair**:
   - 后端解析 JSON。
   - (可选) 静态检查代码是否存在明显语法错误。
   - 如果解析失败，触发自动重试 (Auto-Retry).
6. **Response**: 后端返回清洗后的 JSON 数据.
7. **Rendering**: 前端 Sandpack 接收代码，动态挂载依赖，渲染组件.

### 3.2 接口定义 (Draft)

**POST /api/generate**
- **Request**:
  ```json
  {
    "prompt": "Show me a visualization of a sine wave.",
    "model": "deepseek-chat" (optional)
  }
  ```
- **Response**:
  ```json
  {
    "explanation": "这是一个正弦波的可视化演示...",
    "code": "import React from 'react'; ... export default function App() { ... }",
    "status": "success"
  }
  ```

---

## 4. 开发规范

### 4.1 代码风格
- **Frontend**: ESLint + Prettier. 组件命名帕斯卡命名法 (PascalCase)，文件命名短横线 (kebab-case).
- **Backend**: PEP 8, Black / Ruff formatter. 类型提示 (Type Hints) 是必须的。

### 4.2 Git 提交规范
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档变更
- `style`: 代码格式调整
- `refactor`: 重构
- `chore`: 构建/工具链相关

---

## 5. 安全与隐私
- **Key Management**: API Key 严禁硬编码，必须通过环境变量 (`.env`) 加载.
- **Sandpack Security**: Sandpack 运行在 iframe 沙箱中，天然隔离，但需注意防范恶意代码注入 (XSS)，尽量不透传敏感 Cookie.
