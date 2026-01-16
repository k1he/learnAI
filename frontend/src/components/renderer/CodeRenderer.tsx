"use client";

import { useState, useCallback } from "react";
import { IframeRenderer } from "./IframeRenderer";
import { cn } from "@/lib/utils";

interface CodeRendererProps {
  code: string | null;
  status?: "loading" | "success" | "error";
  error?: string | null;
  className?: string;
}

/**
 * CodeRenderer - 代码预览主组件
 *
 * 替换原来的 Sandpack，提供：
 * - 加载状态显示
 * - 错误状态显示
 * - 空状态显示
 * - 成功时渲染 iframe
 */
export function CodeRenderer({
  code,
  status = "success",
  error,
  className,
}: CodeRendererProps) {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setRuntimeError(null);
  }, []);

  const handleError = useCallback((err: { message: string; stack?: string }) => {
    setRuntimeError(err.message);
  }, []);

  // 加载状态
  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full bg-muted/30 rounded-lg",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">正在生成可视化...</p>
        </div>
      </div>
    );
  }

  // 外部错误状态（如 API 错误）
  if (status === "error" || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full bg-destructive/10 rounded-lg p-4",
          className
        )}
      >
        <div className="text-center">
          <svg
            className="h-10 w-10 text-destructive mx-auto mb-3"
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
          <p className="text-destructive font-medium mb-2">生成失败</p>
          <p className="text-muted-foreground text-sm max-w-md">
            {error || "请重试或修改您的请求"}
          </p>
        </div>
      </div>
    );
  }

  // 空状态
  if (!code) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full bg-muted/30 rounded-lg p-4",
          className
        )}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">
            输入问题后，可视化结果将显示在这里
          </p>
        </div>
      </div>
    );
  }

  // 成功状态 - 渲染代码
  return (
    <div className={cn("h-full w-full relative", className)}>
      {/* 加载指示器（代码正在编译/渲染时） */}
      {!isReady && !runtimeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground text-xs">渲染中...</p>
          </div>
        </div>
      )}

      {/* 运行时错误提示 */}
      {runtimeError && (
        <div className="absolute top-2 left-2 right-2 z-20">
          <div className="bg-destructive/90 text-destructive-foreground text-xs p-2 rounded-md">
            <span className="font-medium">运行时错误:</span> {runtimeError}
          </div>
        </div>
      )}

      <IframeRenderer code={code} onReady={handleReady} onError={handleError} />
    </div>
  );
}

// 导出子组件，方便按需使用
export { IframeRenderer } from "./IframeRenderer";
export { compileCode } from "./CompilerService";
