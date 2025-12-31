# Concept Canvas

Concept Canvas 是一个“生成式可视化解释”工具 (Generative Explorable Explanations)。它利用大模型将用户的自然语言提问转化为动态的 React 组件，并在浏览器中实时渲染，帮助用户直观理解复杂概念。

## 项目结构 (Monorepo)

- **frontend/**: Next.js + Tailwind CSS + Shadcn/UI + Sandpack
- **backend/**: FastAPI + Python + OpenAI SDK (DeepSeek/Qwen)
- **docs/**: 项目文档 (架构设计 ARCHITECTURE.md)

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```
访问: http://localhost:3000

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
访问: http://localhost:8000/docs

## 核心功能 (MVP)

1. **Prompt to Visual**: 输入 "展示正态分布"，生成可交互图表。
2. **Auto-Repair**: 后端自动校验并修复生成的代码。
3. **Sandpack Rendering**: 安全的浏览器端沙箱运行环境。

## 文档

详细架构请查阅 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。
