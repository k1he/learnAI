# Concept Canvas (概念画布)

<p align="center">
  <strong>基于 Next.js 的生成式交互可视化解释工具</strong><br>
  <em>Generative Explorable Explanations</em>
</p>

---

## 简介

Concept Canvas 利用大语言模型将自然语言提问转化为**动态的、可交互的 React 组件**。本项目已实现完全的 Node.js 化，移除了 Python 后端，所有逻辑均集成在 Next.js 框架中。

### 核心特性

- **Prompt to Visual**: 输入“展示冒泡排序”，自动生成可交互的动画。
- **纯 Node.js 架构**: 基于 Next.js 15，API 路由处理 LLM 交互与代码生成。
- **实时渲染**: 在安全的 Iframe 沙箱中实时编译并渲染 AI 生成的代码。
- **交互增强**: 集成了 **Recharts** 和 **Framer Motion**，支持生成专业图表与丝滑动画。
- **全中文支持**: 系统提示词经过优化，生成内容与 UI 界面完全中文化。

## 快速开始

### 环境要求

- Node.js 18+
- LLM API Key (支持 OpenAI 兼容接口，如 DeepSeek)

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并填入以下内容：

```env
LLM_API_KEY=你的_API_KEY
LLM_BASE_URL=https://api.deepseek.com/v1 # 或其他兼容地址
DEFAULT_MODEL=deepseek-chat
```

### 3. 构建运行时

生成沙箱所需的预编译 React 运行时：

```bash
npm run build:runtime
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

## 技术栈

- **前端框架**: Next.js 15 (App Router), React 19
- **样式**: Tailwind CSS, Shadcn UI
- **可视化**: Recharts, Framer Motion
- **代码编译**: Sucrase (浏览器端实时编译)
- **脚本工具**: esbuild (构建运行时)

## 项目结构

- `src/app/api/chat/generate`: LLM 代码生成接口
- `src/components/renderer`: 核心渲染引擎，处理沙箱隔离与代码注入
- `src/lib/llm.ts`: 核心 Prompt 模板与 LLM 配置
- `public/runtime`: 预编译的 React 运行时及沙箱 HTML

## License

MIT
