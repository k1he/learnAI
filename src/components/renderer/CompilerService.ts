/**
 * CompilerService - 编译服务客户端
 *
 * 将 AI 生成的 JSX/TSX 代码发送到服务端编译
 */

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
  unsupportedLibraries?: string[];
}

/**
 * 编译 JSX 代码为可执行的 JavaScript
 *
 * @param code - AI 生成的 JSX/TSX 源代码
 * @returns 编译结果，包含编译后的代码或错误信息
 */
export async function compileCode(code: string): Promise<CompileResult> {
  try {
    // 发送到服务端编译
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Compile API error: ${response.status} ${response.statusText}`);
    }

    const result: CompileResult = await response.json();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown compilation error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
