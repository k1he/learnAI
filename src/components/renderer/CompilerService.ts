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
  unsupportedLibraries?: string[];
}

/**
 * 修复 AI 生成代码中的常见语法问题
 *
 * @param code - 原始代码
 * @returns 修复后的代码
 */
function fixCommonSyntaxIssues(code: string): string {
  let result = code;

  // 1. 移除 import 语句中的注释（常见错误来源）
  result = result.replace(
    /import\s*\{([^}]*)\}\s*from/g,
    (match, imports) => {
      const cleanImports = imports
        .replace(/\/\/.*$/gm, '')  // 移除单行注释
        .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
        .replace(/\s+/g, ' ')  // 规范化空格
        .trim();
      return `import { ${cleanImports} } from`;
    }
  );

  // 2. 修复模板字符串中的问题 - 转义未闭合的反引号
  // 这个比较复杂，简单处理：确保反引号成对
  
  // 3. 移除可能导致问题的 BOM 和特殊字符
  result = result.replace(/^\uFEFF/, '');
  
  // 4. 修复常见的 JSX 语法问题
  // 修复 className 中的模板字符串问题
  result = result.replace(
    /className=\{`([^`]*)`\s*\+\s*`([^`]*)`\}/g,
    'className={`$1$2`}'
  );

  // 5. 修复可能的分号问题 - 在 import 后确保有分号
  result = result.replace(
    /(import\s+.*?from\s+['"][^'"]+['"])\s*(?!\s*;)/g,
    '$1;'
  );

  // 6. 修复 export default 后面直接跟 const/let 的问题
  result = result.replace(
    /export\s+default\s+(const|let|var)\s+/g,
    '$1 '
  );

  return result;
}

/**
 * 编译 JSX 代码为可执行的 JavaScript
 *
 * @param code - AI 生成的 JSX/TSX 源代码
 * @returns 编译结果，包含编译后的代码或错误信息
 */
export function compileCode(code: string): CompileResult {
  try {
    // 首先修复常见语法问题
    const fixedCode = fixCommonSyntaxIssues(code);

    // 检测不支持的第三方库
    const unsupportedLibs = detectUnsupportedLibraries(fixedCode);
    if (unsupportedLibs.length > 0) {
      return {
        success: false,
        error: buildUnsupportedLibrariesError(unsupportedLibs),
        unsupportedLibraries: unsupportedLibs,
      };
    }

    // 先从原始代码提取组件名称（在预处理之前）
    const componentName = extractComponentName(fixedCode);

    // 预处理：移除 import 语句，因为 React 已在全局可用
    const processedCode = preprocessCode(fixedCode);

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
  let result = code;

  // 更加鲁棒地转换 recharts 和 framer-motion 的导入
  // 支持多行、不同空格和引号
  result = result.replace(
    /import\s+\{([\s\S]*?)\}\s+from\s+['"]recharts['"];?/g,
    (match, p1) => `const { ${p1.replace(/\n/g, ' ')} } = window.Recharts;`
  );
  result = result.replace(
    /import\s+\{([\s\S]*?)\}\s+from\s+['"]framer-motion['"];?/g,
    (match, p1) => `const { ${p1.replace(/\n/g, ' ')} } = window.FramerMotion;`
  );

  // 移除所有剩余的顶级 import 语句
  result = result.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '');
  result = result.replace(/^import\s+['"][^'"]+['"];?/gm, '');
  result = result.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/gm, '');

  // 移除 require 语句
  result = result.replace(/^(const|let|var)\s+.*?=\s*require\s*\(['"][^'"]+['"]\);?/gm, '');

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

/**
 * 检测代码中使用的不支持的第三方库
 *
 * 支持的库（运行时可用）：
 * - react (全局可用)
 * - react-dom (全局可用)
 *
 * @param code - 源代码
 * @returns 不支持的库名称列表
 */
function detectUnsupportedLibraries(code: string): string[] {
  const unsupportedLibs = new Set<string>();

  // 支持的库白名单
  const supportedLibraries = new Set([
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'recharts',
    'framer-motion',
  ]);

  // 正则匹配所有 import 语句
  const importRegex = /import\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const libraryName = match[1];

    // 跳过相对路径导入
    if (libraryName.startsWith('.') || libraryName.startsWith('/')) {
      continue;
    }

    // 提取包名（处理 scoped packages 和子路径）
    const packageName = libraryName.startsWith('@')
      ? libraryName.split('/').slice(0, 2).join('/')
      : libraryName.split('/')[0];

    if (!supportedLibraries.has(packageName) && !supportedLibraries.has(libraryName)) {
      unsupportedLibs.add(packageName);
    }
  }

  // 检测常见的全局引用（如直接使用 lodash、moment 等）
  const commonLibraries = [
    { name: 'lodash', patterns: ['_.', 'lodash'] },
    { name: 'moment', patterns: ['moment('] },
    { name: 'axios', patterns: ['axios.'] },
    { name: 'd3', patterns: ['d3.'] },
    { name: 'chart.js', patterns: ['Chart.'] },
  ];

  for (const lib of commonLibraries) {
    if (!unsupportedLibs.has(lib.name)) {
      for (const pattern of lib.patterns) {
        if (code.includes(pattern)) {
          unsupportedLibs.add(lib.name);
          break;
        }
      }
    }
  }

  return Array.from(unsupportedLibs);
}

/**
 * 构建不支持库的友好错误消息
 */
function buildUnsupportedLibrariesError(libraries: string[]): string {
  const libList = libraries.map(lib => `  - ${lib}`).join('\n');

  return `检测到使用了不支持的第三方库：

${libList}

当前运行时仅支持 React、React DOM、Recharts 和 Framer Motion。

建议：
1. 使用纯 React 组件、HTML/CSS 或 Recharts 实现可视化
2. 使用 SVG、Canvas API 或 Framer Motion 增加交互动画
3. 避免依赖其他第三方库（如 axios、lodash 等）

示例：可以使用 <svg> 元素、Recharts 组件或 Framer Motion 的 <motion.div>。`;
}
