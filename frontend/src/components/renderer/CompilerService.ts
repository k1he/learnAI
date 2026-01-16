/**
 * CompilerService - 使用 Sucrase 编译 JSX 代码
 *
 * 将 AI 生成的 JSX/TSX 代码转换为浏览器可执行的 JavaScript
 */

import { transform } from "sucrase";

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * 编译 JSX 代码为可执行的 JavaScript
 *
 * @param code - AI 生成的 JSX/TSX 源代码
 * @returns 编译结果，包含编译后的代码或错误信息
 */
export function compileCode(code: string): CompileResult {
  try {
    // 先从原始代码提取组件名称（在预处理之前）
    const componentName = extractComponentName(code);

    // 预处理：移除 import 语句，因为 React 已在全局可用
    const processedCode = preprocessCode(code);

    // 使用 Sucrase 编译 JSX
    const result = transform(processedCode, {
      transforms: ["jsx", "typescript"],
      jsxRuntime: "classic",
      production: true,
    });

    // 后处理：包装成可执行的模块
    const executableCode = wrapCode(result.code, componentName);

    return {
      success: true,
      code: executableCode,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown compilation error",
    };
  }
}

/**
 * 预处理代码：
 * 移除所有 import 语句，因为依赖已在全局可用
 */
function preprocessCode(code: string): string {
  // 移除所有 import 语句（单行和多行）
  let result = code;

  // 移除单行 import: import xxx from 'xxx'
  result = result.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');

  // 移除单行 import: import 'xxx' (副作用导入)
  result = result.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

  // 移除多行 import
  result = result.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

  // 移除 require 语句
  result = result.replace(/^(const|let|var)\s+.*?=\s*require\s*\(['"][^'"]+['"]\);?\s*$/gm, '');

  return result;
}

/**
 * 包装编译后的代码，使其可在 iframe 中执行
 *
 * 生成的代码结构：
 * 1. 从全局获取 React
 * 2. 执行用户代码，获取默认导出的组件
 * 3. 渲染组件到 #root
 */
function wrapCode(compiledCode: string, componentName: string): string {
  return `
(function() {
  const React = window.React;
  const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, Fragment } = React;
  const ReactDOM = window.ReactDOM;

  try {
    // 用户代码开始
    ${transformExports(compiledCode)}
    // 用户代码结束

    // 获取要渲染的组件
    const AppComponent = typeof ${componentName} !== 'undefined' ? ${componentName} :
                         typeof App !== 'undefined' ? App :
                         typeof default_1 !== 'undefined' ? default_1 :
                         null;

    if (AppComponent) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(AppComponent));

      // 通知父窗口渲染成功
      window.parent.postMessage({ type: 'ready' }, '*');
    } else {
      throw new Error('No component found. Please export a default component.');
    }
  } catch (error) {
    // 通知父窗口发生错误
    window.parent.postMessage({
      type: 'error',
      message: error.message,
      stack: error.stack
    }, '*');
  }
})();
`.trim();
}

/**
 * 从代码中提取组件名称
 * 支持: export default function ComponentName / function ComponentName / const ComponentName
 */
function extractComponentName(code: string): string {
  // 匹配 export default function ComponentName
  const exportDefaultFuncMatch = code.match(/export\s+default\s+function\s+(\w+)/);
  if (exportDefaultFuncMatch) {
    return exportDefaultFuncMatch[1];
  }

  // 匹配 function ComponentName (首字母大写)
  const funcMatch = code.match(/function\s+([A-Z]\w*)\s*\(/);
  if (funcMatch) {
    return funcMatch[1];
  }

  // 匹配 const ComponentName = (首字母大写的箭头函数)
  const constMatch = code.match(/(?:const|let|var)\s+([A-Z]\w*)\s*=/);
  if (constMatch) {
    return constMatch[1];
  }

  // 默认返回 App
  return 'App';
}

/**
 * 转换 export 语句为变量声明
 *
 * export default function App() {} -> function App() {}; var default_1 = App;
 */
function transformExports(code: string): string {
  let result = code;

  // 处理 export default function
  result = result.replace(
    /export\s+default\s+function\s+(\w+)/g,
    "function $1"
  );

  // 处理 export default class
  result = result.replace(
    /export\s+default\s+class\s+(\w+)/g,
    "class $1"
  );

  // 处理 export default 表达式（如箭头函数）
  result = result.replace(
    /export\s+default\s+/g,
    "var default_1 = "
  );

  // 处理命名 export
  result = result.replace(/export\s+/g, "");

  return result;
}
