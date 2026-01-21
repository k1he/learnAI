/**
 * BabelCompiler - 使用 Babel AST 编译 JSX/TSX 代码
 * 
 * 彻底替代正则表达式处理，使用 AST 精确转换 import/export 语句
 */

import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { transformFromAstSync } from '@babel/core';

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
  unsupportedLibraries?: string[];
  undefinedVariables?: UndefinedVariable[];
}

export interface UndefinedVariable {
  name: string;
  line: number;
  column: number;
  scope?: string;
}

interface ImportInfo {
  default?: string;
  named: string[];
  namespace?: string;
}

/**
 * Babel 编译器核心类
 */
export class BabelCompiler {
  // 支持的库白名单
  private static readonly SUPPORTED_LIBRARIES = new Set([
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'recharts',
    'framer-motion',
    'lucide-react',
  ]);

  // 允许的全局变量（避免未定义变量误报）
  private static readonly GLOBAL_ALLOWLIST = new Set([
    'window',
    'document',
    'console',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'fetch',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'React',
    'ReactDOM',
    'Fragment',
    'useState',
    'useEffect',
    'useRef',
    'useMemo',
    'useCallback',
    'useContext',
    'createContext',
    'Math',
    'Date',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'RegExp',
    'Set',
    'Map',
    'WeakMap',
    'WeakSet',
    'Symbol',
    'BigInt',
    'JSON',
    'Intl',
    'Promise',
    'Error',
    'TypeError',
    'NaN',
    'Infinity',
    'undefined',
  ]);

  /**
   * 编译 JSX/TSX 代码为可执行的 JavaScript
   */
  compile(code: string): CompileResult {
    try {
      // 1. 解析代码为 AST
      const ast = this.parseCode(code);

      // 2. 检测不支持的库
      const unsupportedLibs = this.detectUnsupportedLibraries(ast);
      if (unsupportedLibs.length > 0) {
        return {
          success: false,
          error: this.buildUnsupportedLibrariesError(unsupportedLibs),
          unsupportedLibraries: unsupportedLibs,
        };
      }

      // 3. 检测未定义变量
      const undefinedVariables = this.detectUndefinedVariables(ast);
      if (undefinedVariables.length > 0) {
        return {
          success: false,
          error: this.buildUndefinedVariablesError(undefinedVariables),
          undefinedVariables,
        };
      }

      // 4. 转换 AST（处理 import/export）
      this.transformAST(ast);

      // 5. 生成代码
      const generatedCode = this.generateCode(ast);

      // 6. 包装为可执行代码
      const componentName = this.extractComponentName(code);
      const executableCode = this.wrapCode(generatedCode, componentName);

      return {
        success: true,
        code: executableCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error',
      };
    }
  }

  /**
   * 解析代码为 AST
   */
  private parseCode(code: string): t.File {
    try {
      return parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          // 支持现代 JavaScript 特性
          'classProperties',
          'decorators-legacy',
          'objectRestSpread',
          'optionalChaining',
          'nullishCoalescingOperator',
        ],
      });
    } catch (error) {
      throw new Error(this.formatBabelParseError(error));
    }
  }

  /**
   * 格式化 Babel 解析错误，提取行号和列号
   */
  private formatBabelParseError(error: unknown): string {
    if (error && typeof error === 'object' && 'loc' in error) {
      const anyError = error as { loc?: { line?: number; column?: number }; message?: string };
      const line = anyError.loc?.line;
      const column = anyError.loc?.column;
      if (typeof line === 'number' && typeof column === 'number') {
        const message = anyError.message || 'Parse error';
        return `Line ${line}, Col ${column + 1}: ${message}`;
      }
    }
    return error instanceof Error ? error.message : 'Unknown parsing error';
  }

  /**
   * 检测未定义变量
   */
  private detectUndefinedVariables(ast: t.File): UndefinedVariable[] {
    const undefinedVars: UndefinedVariable[] = [];
    const seen = new Set<string>();

    const record = (
      name: string,
      loc: t.SourceLocation | null | undefined,
      scopeType?: string
    ) => {
      const line = loc?.start.line ?? 0;
      const column = loc?.start.column ?? 0;
      const key = `${name}:${line}:${column}`;
      if (seen.has(key)) return;
      seen.add(key);
      undefinedVars.push({ name, line, column, scope: scopeType });
    };

    const isAllowedGlobal = (name: string) => BabelCompiler.GLOBAL_ALLOWLIST.has(name);

    const getJSXRootIdentifier = (
      node: t.JSXIdentifier | t.JSXMemberExpression
    ): t.JSXIdentifier | null => {
      if (t.isJSXIdentifier(node)) return node;
      if (t.isJSXMemberExpression(node)) return getJSXRootIdentifier(node.object);
      return null;
    };

    const checkJSXName = (
      node: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
      scope: NodePath['scope']
    ) => {
      // JSXNamespacedName (如 xml:lang) 不需要检查变量绑定
      if (t.isJSXNamespacedName(node)) return;
      const root = getJSXRootIdentifier(node);
      if (!root) return;
      const name = root.name;
      if (!name) return;
      if (name[0] === name[0].toLowerCase()) return;
      if (isAllowedGlobal(name)) return;
      if (scope.hasBinding(name)) return;
      record(name, root.loc, scope.block.type);
    };

    traverse(ast, {
      Identifier(path) {
        if (!path.isReferencedIdentifier()) return;
        const name = path.node.name;
        if (isAllowedGlobal(name)) return;
        if (path.scope.hasBinding(name)) return;
        record(name, path.node.loc, path.scope.block.type);
      },
      JSXOpeningElement(path) {
        checkJSXName(path.node.name, path.scope);
      },
      JSXClosingElement(path) {
        checkJSXName(path.node.name, path.scope);
      },
    });

    return undefinedVars;
  }

  /**
   * 构建未定义变量错误消息
   */
  private buildUndefinedVariablesError(undefinedVariables: UndefinedVariable[]): string {
    return undefinedVariables
      .map((item) => `Line ${item.line}, Col ${item.column + 1}: '${item.name}' is not defined`)
      .join('\n');
  }

  /**
   * 转换 AST：处理 import 和 export 语句
   */
  private transformAST(ast: t.File): void {
    const rechartsImports: ImportInfo = { named: [] };
    const framerMotionImports: ImportInfo = { named: [] };
    const lucideImports: ImportInfo = { named: [] };
    const nodesToRemove: NodePath[] = [];
    const nodesToPrepend: t.Statement[] = [];

    traverse(ast, {
      // 处理 import 语句
      ImportDeclaration(path) {
        const source = path.node.source.value;

        // React 导入 - 直接删除（运行时全局可用）
        if (source === 'react' || source.startsWith('react/')) {
          nodesToRemove.push(path);
          return;
        }

        // Recharts 导入
        if (source === 'recharts') {
          path.node.specifiers.forEach((spec) => {
            if (t.isImportDefaultSpecifier(spec)) {
              rechartsImports.default = spec.local.name;
            } else if (t.isImportSpecifier(spec)) {
              rechartsImports.named.push(spec.local.name);
            } else if (t.isImportNamespaceSpecifier(spec)) {
              rechartsImports.namespace = spec.local.name;
            }
          });
          nodesToRemove.push(path);
          return;
        }

        // Framer Motion 导入
        if (source === 'framer-motion') {
          path.node.specifiers.forEach((spec) => {
            if (t.isImportDefaultSpecifier(spec)) {
              framerMotionImports.default = spec.local.name;
            } else if (t.isImportSpecifier(spec)) {
              framerMotionImports.named.push(spec.local.name);
            } else if (t.isImportNamespaceSpecifier(spec)) {
              framerMotionImports.namespace = spec.local.name;
            }
          });
          nodesToRemove.push(path);
          return;
        }

        // Lucide React 导入
        if (source === 'lucide-react') {
          path.node.specifiers.forEach((spec) => {
            if (t.isImportDefaultSpecifier(spec)) {
              lucideImports.default = spec.local.name;
            } else if (t.isImportSpecifier(spec)) {
              lucideImports.named.push(spec.local.name);
            } else if (t.isImportNamespaceSpecifier(spec)) {
              lucideImports.namespace = spec.local.name;
            }
          });
          nodesToRemove.push(path);
          return;
        }

        // 其他相对路径导入 - 保留但警告
        if (source.startsWith('.') || source.startsWith('/')) {
          console.warn(`[BabelCompiler] Relative import detected: ${source}`);
          return;
        }

        // 其他第三方库 - 已在 detectUnsupportedLibraries 中检测
      },

      // 处理 export default 语句
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;

        if (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) {
          // export default function App() {} -> function App() {}
          path.replaceWith(declaration);
        } else {
          // export default <expression> -> var default_1 = <expression>
          const varDeclaration = t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier('default_1'), declaration as t.Expression),
          ]);
          path.replaceWith(varDeclaration);
        }
      },

      // 处理命名 export 语句
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          // export const foo = 1 -> const foo = 1
          path.replaceWith(path.node.declaration);
        } else if (path.node.specifiers.length > 0) {
          // export { foo, bar } -> 删除（在 iframe 环境不需要）
          path.remove();
        }
      },
    });

    // 删除标记的节点
    nodesToRemove.forEach((path) => path.remove());

    // 在顶部添加全局变量解构
    if (framerMotionImports.namespace) {
      nodesToPrepend.push(
        this.createWindowAssignment(framerMotionImports.namespace, 'FramerMotion')
      );
    }
    if (framerMotionImports.default) {
      nodesToPrepend.push(
        this.createWindowAssignment(framerMotionImports.default, 'FramerMotion')
      );
    }
    if (framerMotionImports.named.length > 0) {
      nodesToPrepend.push(
        this.createWindowDestructuring(framerMotionImports.named, 'FramerMotion')
      );
    }

    if (rechartsImports.namespace) {
      nodesToPrepend.push(
        this.createWindowAssignment(rechartsImports.namespace, 'Recharts')
      );
    }
    if (rechartsImports.default) {
      nodesToPrepend.push(
        this.createWindowAssignment(rechartsImports.default, 'Recharts')
      );
    }
    if (rechartsImports.named.length > 0) {
      nodesToPrepend.push(
        this.createWindowDestructuring(rechartsImports.named, 'Recharts')
      );
    }

    // Lucide Icons
    if (lucideImports.namespace) {
      nodesToPrepend.push(
        this.createWindowAssignment(lucideImports.namespace, 'LucideIcons')
      );
    }
    if (lucideImports.default) {
      nodesToPrepend.push(
        this.createWindowAssignment(lucideImports.default, 'LucideIcons')
      );
    }
    if (lucideImports.named.length > 0) {
      nodesToPrepend.push(
        this.createWindowDestructuring(lucideImports.named, 'LucideIcons')
      );
    }

    // 插入到 Program 顶部
    if (nodesToPrepend.length > 0) {
      ast.program.body.unshift(...nodesToPrepend);
    }
  }

  /**
   * 创建 window 解构语句：const { X, Y } = window.SomeLib;
   */
  private createWindowDestructuring(members: string[], globalName: string): t.VariableDeclaration {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.objectPattern(members.map((m) => t.objectProperty(t.identifier(m), t.identifier(m), false, true))),
        t.memberExpression(t.identifier('window'), t.identifier(globalName))
      ),
    ]);
  }

  /**
   * 创建 window 赋值语句：const X = window.SomeLib;
   */
  private createWindowAssignment(varName: string, globalName: string): t.VariableDeclaration {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(varName),
        t.memberExpression(t.identifier('window'), t.identifier(globalName))
      ),
    ]);
  }

  /**
   * 生成 JavaScript 代码（包含 JSX 转换）
   */
  private generateCode(ast: t.File): string {
    // 使用 transformFromAstSync 来同时转换 JSX 和 TypeScript
    const result = transformFromAstSync(ast, undefined, {
      presets: [
        ['@babel/preset-react', { runtime: 'classic' }],
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
      configFile: false,
      babelrc: false,
    });

    if (!result || !result.code) {
      throw new Error('Babel transformation failed');
    }

    return result.code;
  }

  /**
   * 检测不支持的第三方库
   */
  private detectUnsupportedLibraries(ast: t.File): string[] {
    const unsupportedLibs = new Set<string>();

    traverse(ast, {
      ImportDeclaration(path) {
        const libraryName = path.node.source.value;

        // 跳过相对路径导入
        if (libraryName.startsWith('.') || libraryName.startsWith('/')) {
          return;
        }

        // 提取包名（处理 scoped packages 和子路径）
        const packageName = libraryName.startsWith('@')
          ? libraryName.split('/').slice(0, 2).join('/')
          : libraryName.split('/')[0];

        if (
          !BabelCompiler.SUPPORTED_LIBRARIES.has(packageName) &&
          !BabelCompiler.SUPPORTED_LIBRARIES.has(libraryName)
        ) {
          unsupportedLibs.add(packageName);
        }
      },
    });

    return Array.from(unsupportedLibs);
  }

  /**
   * 构建不支持库的友好错误消息
   */
  private buildUnsupportedLibrariesError(libraries: string[]): string {
    const libList = libraries.map((lib) => `  - ${lib}`).join('\n');

    return `检测到使用了不支持的第三方库：

${libList}

当前运行时仅支持 React、React DOM、Recharts 和 Framer Motion。

建议：
1. 使用纯 React 组件、HTML/CSS 或 Recharts 实现可视化
2. 使用 SVG、Canvas API 或 Framer Motion 增加交互动画
3. 避免依赖其他第三方库（如 axios、lodash 等）

示例：可以使用 <svg> 元素、Recharts 组件或 Framer Motion 的 <motion.div>。`;
  }

  /**
   * 从代码中提取组件名称
   */
  private extractComponentName(code: string): string {
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
   * 包装编译后的代码，使其可在 iframe 中执行
   */
  private wrapCode(compiledCode: string, componentName: string): string {
    return `
(function() {
  const React = window.React;
  if (!React || typeof React.createElement !== 'function') {
    throw new Error('React not properly loaded. window.React=' + typeof window.React);
  }
  
  const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, Fragment } = React;
  const ReactDOM = window.ReactDOM;

  try {
    // 用户代码开始
    ${compiledCode}
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
}
