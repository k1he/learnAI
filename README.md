# Concept Canvas

<p align="center">
  <strong>生成式可视化解释工具</strong><br>
  <em>Generative Explorable Explanations</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript">
</p>

---

## 简介

Concept Canvas 利用大语言模型将自然语言提问转化为**动态的、可交互的 React 组件**，并在浏览器中实时渲染，帮助用户直观理解复杂概念。

### 核心特性

- **Prompt to Visual**: 输入 "展示正弦波"，自动生成可交互图表
- **实时渲染**: 基于 Sandpack 的安全浏览器沙箱环境
- **智能重试**: 后端自动校验并修复生成的代码
- **Split View**: 同时查看可视化结果和文字解释

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 18+
- LLM API Key (DeepSeek / OpenAI 兼容)

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/concept-canvas.git
cd concept-canvas
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Key

# 启动服务
uvicorn app.main:app --reload
```

后端运行在: http://localhost:8000

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在: http://localhost:3000

## 项目结构

```
concept-canvas/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/         # API 路由
│   │   ├── core/           # 配置、LLM 客户端
│   │   ├── schemas/        # Pydantic 模型
│   │   └── services/       # 业务逻辑、Prompt 模板
│   └── requirements.txt
│
├── frontend/                # Next.js 前端
│   ├── src/
│   │   ├── app/            # 页面路由
│   │   ├── components/     # React 组件
│   │   │   ├── ui/         # Shadcn/UI 基础组件
│   │   │   └── visualization/  # 可视化组件
│   │   ├── lib/            # 工具函数
│   │   └── types/          # TypeScript 类型
│   └── package.json
│
├── docs/                    # 项目文档
│   └── ARCHITECTURE.md     # 架构设计
│
└── specs/                   # 功能规格说明
```

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS, Shadcn/UI |
| **Visualization** | @codesandbox/sandpack-react, recharts |
| **Backend** | FastAPI, Pydantic, OpenAI SDK |
| **LLM** | DeepSeek API (兼容 OpenAI 格式) |

## API 文档

启动后端后访问: http://localhost:8000/api/v1/docs

### POST /api/v1/generate

生成可视化组件

**Request:**
```json
{
  "prompt": "展示正弦波",
  "model": "deepseek-chat"  // 可选
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "explanation": "正弦波是一种平滑的周期性振荡...",
    "code": "import React from 'react';\n..."
  }
}
```

## 配置说明

### 后端环境变量 (`backend/.env`)

```env
# LLM 配置
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.deepseek.com/v1
DEFAULT_MODEL=deepseek-chat
```

### 支持的 LLM 服务

| 服务商 | BASE_URL |
|--------|----------|
| DeepSeek | `https://api.deepseek.com/v1` |
| OpenAI | `https://api.openai.com/v1` |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` |

## 开发指南

### 代码规范

- **Frontend**: ESLint + Prettier
- **Backend**: Ruff + Black
- **Commit**: [Conventional Commits](https://www.conventionalcommits.org/)

### 运行测试

```bash
# 后端测试
cd backend && pytest

# 前端测试
cd frontend && npm test
```

## License

MIT License

## 致谢

- [Sandpack](https://sandpack.codesandbox.io/) - 浏览器端代码编辑器
- [Recharts](https://recharts.org/) - React 图表库
- [Shadcn/UI](https://ui.shadcn.com/) - UI 组件库
