1. 系统架构概览
采用 Client-Server 架构。前端负责交互与沙箱渲染，后端负责与大模型通信及 prompt 处理。
2. 后端 (Backend)
语言/框架：Python / FastAPI。
核心职责：
提供 RESTful API 接口。
Prompt Engineering：拼接系统提示词，强制模型输出 JSON 格式（包含 explanation 和 code 字段）。
LLM Proxy：调用兼容 OpenAI 格式的大模型接口。
流式响应 (Streaming)：支持 Server-Sent Events (SSE) 或分块传输，以减少用户等待焦虑（可选，MVP 后期实现）。
3. 前端 (Frontend)
宿主框架：Next.js (React)。
注意：虽然我不熟悉 React，但请你全权负责生成标准的 Next.js 代码结构。
UI 组件库：TailwindCSS + Shadcn/UI (保证界面美观且开发极快)。
核心引擎 (The Container)：Sandpack (@codesandbox/sandpack-react)。
这是一个浏览器端的 React 运行时，用于动态编译和运行 AI 生成的代码。
AI 预设依赖 (Pre-installed Deps)：
在 Sandpack 中预装以下库，供 AI 调用：
recharts (图表绘制)
framer-motion (物理与平滑动画)
lucide-react (图标)
mathjs (复杂数学运算)
4. 交互协议 (Interaction Protocol)
AI 生成的代码必须遵循特定的 React 组件结构：
必须 Default Export 一个名为 App 的组件。
界面必须分为 View（演示区） 和 Control（控制区）。
使用 TailwindCSS 进行样式修饰。