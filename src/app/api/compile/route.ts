/**
 * 编译 API 端点
 * 
 * 接收 JSX/TSX 源代码，使用 Babel 编译为可执行的 JavaScript
 */

import { NextRequest, NextResponse } from 'next/server';
import { BabelCompiler } from '@/lib/babel-compiler';
import fs from 'fs/promises';
import path from 'path';

interface CompileRequest {
  code: string;
}

/**
 * 记录编译后的代码（用于调试）
 */
async function logCompiledCode(code: string): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'compiled-code');
    await fs.mkdir(logDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${timestamp}.js`);

    await fs.writeFile(logFile, code);
  } catch (error) {
    console.error('[Compile API] Failed to log compiled code:', error);
  }
}

/**
 * 记录编译错误
 */
async function logCompileError(
  originalCode: string,
  error: string,
  unsupportedLibraries?: string[]
): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'compile-errors');
    await fs.mkdir(logDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${timestamp}.json`);

    const logData = {
      timestamp: new Date().toISOString(),
      code: originalCode,
      error,
      unsupportedLibraries,
    };

    await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
  } catch (err) {
    console.error('[Compile API] Failed to log compile error:', err);
  }
}

/**
 * POST /api/compile
 * 
 * 编译 JSX/TSX 代码
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求
    const body: CompileRequest = await req.json();
    const { code } = body;

    // 输入校验
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: code is required' },
        { status: 400 }
      );
    }

    // 限制代码长度（防止 DoS）
    const MAX_CODE_LENGTH = 100 * 1024; // 100KB
    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Code too long (max ${MAX_CODE_LENGTH} bytes)` },
        { status: 413 }
      );
    }

    // 编译代码
    const compiler = new BabelCompiler();
    const result = compiler.compile(code);

    // 处理编译失败
    if (!result.success) {
      await logCompileError(code, result.error!, result.unsupportedLibraries);
      return NextResponse.json(result, { status: 200 }); // 返回 200，但 success: false
    }

    // 记录编译后的代码
    await logCompiledCode(result.code!);

    // 返回成功结果
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Compile API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
