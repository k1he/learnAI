# 轻量级代码渲染器设计方案

## 背景

当前项目使用 `@codesandbox/sandpack-react` 作为代码预览引擎，导致：
- node_modules 体积达 545MB
- 开发模式下内存占用过高，可能导致 OOM
- 启动和加载速度慢

## 目标

用轻量级的 iframe + 预编译依赖方案替换 Sandpack，实现：
- 显著降低内存占用
- 加快启动和渲染速度
- 保持 React 组件的实时预览能力

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      主应用 (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   ChatInterface │    │        CodeRenderer             │ │
│  │   (左侧对话区)   │    │        (右侧预览区)              │ │
│  └─────────────────┘    │  ┌───────────────────────────┐  │ │
│                         │  │     Compiler Service      │  │ │
│                         │  │   (Sucrase JSX 编译器)     │  │ │
│                         │  └───────────────────────────┘  │ │
│                         │              ↓                  │ │
│                         │  ┌───────────────────────────┐  │ │
│                         │  │   iframe (sandbox)        │  │ │
│                         │  │  ┌─────────────────────┐  │  │ │
│                         │  │  │ 预编译 React 运行时  │  │  │ │
│                         │  │  │ + 编译后的用户代码   │  │  │ │
│                         │  │  └─────────────────────┘  │  │ │
│                         │  └───────────────────────────┘  │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. Compiler Service（编译服务）

使用 [Sucrase](https://github.com/alangpierce/sucrase) 进行 JSX 编译。

**选择 Sucrase 而非 esbuild-wasm 的原因**：
- Sucrase 更轻量（~1MB vs esbuild-wasm ~10MB）
- 专注于 JSX/TS 转换，不做 bundling
- 纯 JS 实现，无需 WASM 初始化
- 编译速度极快（比 Babel 快 20x）

**职责**：
- 将 AI 生成的 JSX 代码转换为浏览器可执行的 ES5/ES6
- 处理 import/export 语法
- 错误捕获和报告

```typescript
// 示例接口
interface CompilerService {
  compile(code: string): CompileResult;
}

interface CompileResult {
  success: boolean;
  code?: string;      // 编译后的代码
  error?: string;     // 编译错误信息
  sourceMap?: string; // 可选的 source map
}
```

#### 2. Runtime Bundle（预编译运行时）

将 React + ReactDOM 预编译为单个 UMD bundle。

**文件结构**：
```
frontend/public/runtime/
├── react.bundle.js      # React + ReactDOM UMD (~150KB gzip)
└── runtime-template.html # iframe 模板
```

**runtime-template.html 结构**：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
  </style>
  <!-- 预加载 React 运行时 -->
  <script src="/runtime/react.bundle.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    // 用户代码将被注入到这里
    window.__INJECT_CODE_HERE__
  </script>
</body>
</html>
```

#### 3. IframeRenderer（iframe 渲染器）

**职责**：
- 管理 iframe 生命周期
- 注入编译后的代码
- 处理 iframe 与主应用的通信
- 错误边界和恢复

```typescript
interface IframeRendererProps {
  code: string;          // AI 生成的原始 JSX 代码
  onError?: (error: Error) => void;
  onLoad?: () => void;
}
```

**iframe 通信协议**：
```typescript
// 主应用 → iframe
interface InjectMessage {
  type: 'inject';
  code: string;
}

// iframe → 主应用
interface ErrorMessage {
  type: 'error';
  message: string;
  stack?: string;
}

interface ReadyMessage {
  type: 'ready';
}
```

### 数据流

```
1. AI 生成 JSX 代码
   ↓
2. CompilerService.compile(code)
   ↓
3. 编译成功？
   ├─ 否 → 显示编译错误
   └─ 是 → 继续
   ↓
4. IframeRenderer 创建/更新 iframe
   ↓
5. 通过 postMessage 注入编译后的代码
   ↓
6. iframe 内执行代码，渲染 React 组件
   ↓
7. iframe 通过 postMessage 报告状态（ready/error）
```

### 安全考虑

iframe 使用 sandbox 属性限制权限：
```html
<iframe
  sandbox="allow-scripts"
  <!-- 不允许：allow-same-origin, allow-forms, allow-popups -->
/>
```

这确保：
- iframe 内代码无法访问主应用的 DOM
- 无法发起网络请求（除非添加 CSP）
- 无法打开新窗口
- 无法访问 localStorage/cookies

### 错误处理

1. **编译错误**：Sucrase 编译失败时，显示语法错误信息
2. **运行时错误**：iframe 内捕获 window.onerror，通过 postMessage 报告
3. **超时处理**：代码执行超过 5 秒视为死循环，强制重载 iframe
4. **崩溃恢复**：iframe 崩溃时自动重建

## 文件结构

```
frontend/src/
├── components/
│   └── renderer/
│       ├── CodeRenderer.tsx      # 主组件，替换 VisualizerPane
│       ├── IframeRenderer.tsx    # iframe 管理
│       ├── CompilerService.ts    # Sucrase 编译服务
│       └── ErrorDisplay.tsx      # 错误展示组件
├── public/
│   └── runtime/
│       ├── react.bundle.js       # 预编译 React 运行时
│       └── runtime-template.html # iframe 模板
```

## 依赖变更

### 移除
```json
{
  "@codesandbox/sandpack-react": "^2.20.0"
}
```

### 新增
```json
{
  "sucrase": "^3.35.0"
}
```

**体积对比**：
- Sandpack: ~15MB (未压缩，包含所有子依赖)
- Sucrase: ~1MB

## 实现步骤

### Phase 1: 基础设施
1. 创建 `CompilerService.ts`，封装 Sucrase
2. 创建预编译的 React bundle 脚本
3. 生成 `react.bundle.js` 和 `runtime-template.html`

### Phase 2: 渲染器组件
4. 创建 `IframeRenderer.tsx`
5. 实现 postMessage 通信
6. 创建 `CodeRenderer.tsx` 主组件

### Phase 3: 集成替换
7. 在 `VisualizerPane.tsx` 中用新组件替换 Sandpack
8. 移除 `@codesandbox/sandpack-react` 依赖
9. 测试和调试

### Phase 4: 清理优化
10. 删除旧的 Sandpack 相关代码
11. 配置 Next.js 优化
12. 性能测试和调优

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| node_modules 体积 | ~545MB | ~50MB (预估) |
| 首屏加载时间 | 慢 | 快 |
| 内存占用 | 高（可能 OOM）| 低 |
| 代码预览延迟 | 中等 | 低 |

## 风险和缓解

1. **风险**：某些复杂 JSX 语法 Sucrase 不支持
   - 缓解：测试覆盖常见场景，必要时添加预处理

2. **风险**：iframe 通信可能有延迟
   - 缓解：使用 MessageChannel 优化，添加 loading 状态

3. **风险**：预编译的 React 版本固定
   - 缓解：使用稳定版 React 18，长期支持

## 未来扩展

- 支持 Vue（添加 vue.bundle.js）
- 支持图表库（recharts、d3 等按需加载）
- 支持 TypeScript 直接运行
- 代码编辑功能（可选）
