"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { compileCode } from "./CompilerService";

interface IframeRendererProps {
  code: string;
  onReady?: () => void;
  onError?: (error: { message: string; stack?: string }) => void;
}

interface IframeMessage {
  type: "ready" | "error" | "iframe-ready";
  message?: string;
  stack?: string;
}

/**
 * IframeRenderer - 在隔离的 iframe 中渲染 React 代码
 *
 * 特点：
 * - 使用 sandbox 隔离，防止恶意代码
 * - 通过 postMessage 进行安全通信
 * - 自动编译 JSX 并注入执行
 */
export function IframeRenderer({ code, onReady, onError }: IframeRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const pendingCodeRef = useRef<string | null>(null);

  // 处理来自 iframe 的消息
  const handleMessage = useCallback(
    (event: MessageEvent<IframeMessage>) => {
      // 验证消息来源
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
        return;
      }

      const { type, message, stack } = event.data || {};

      switch (type) {
        case "iframe-ready":
          setIsIframeReady(true);
          // 如果有等待的代码，立即注入
          if (pendingCodeRef.current) {
            injectCode(pendingCodeRef.current);
            pendingCodeRef.current = null;
          }
          break;

        case "ready":
          onReady?.();
          break;

        case "error":
          onError?.({ message: message || "Unknown error", stack });
          break;
      }
    },
    [onReady, onError]
  );

  // 注入编译后的代码到 iframe
  const injectCode = useCallback((compiledCode: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "inject", code: compiledCode },
        "*"
      );
    }
  }, []);

  // 监听 postMessage
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // 当代码变化时，编译并注入
  useEffect(() => {
    if (!code) {
      setCompileError(null);
      return;
    }

    // 编译代码（异步）
    let cancelled = false;

    const compile = async () => {
      try {
        const result = await compileCode(code);

        // 如果组件已卸载，忽略结果
        if (cancelled) return;

        if (!result.success) {
          setCompileError(result.error || "Compilation failed");
          onError?.({ message: result.error || "Compilation failed" });
          return;
        }

        setCompileError(null);

        // 如果 iframe 还没准备好，先存起来
        if (!isIframeReady) {
          pendingCodeRef.current = result.code!;
          return;
        }

        // 注入代码
        injectCode(result.code!);
      } catch (error) {
        if (cancelled) return;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setCompileError(errorMessage);
        onError?.({ message: errorMessage });
      }
    };

    compile();

    return () => {
      cancelled = true;
    };
  }, [code, isIframeReady, injectCode, onError]);

  // 编译错误时显示错误界面
  if (compileError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 p-6 rounded-lg">
        <svg
          className="w-12 h-12 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-red-700 mb-2">编译错误</h3>
        <pre className="text-sm text-red-600 bg-white p-4 rounded-lg max-w-full overflow-auto whitespace-pre-wrap">
          {compileError}
        </pre>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src="/runtime/preview.html"
      sandbox="allow-scripts"
      className="w-full h-full border-0 rounded-lg bg-white"
      title="Code Preview"
    />
  );
}
