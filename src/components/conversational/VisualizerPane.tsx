"use client";

import { cn } from "@/lib/utils";
import { CodeRenderer } from "@/components/renderer";
import type { Visualization } from "@/types/conversation";

interface VisualizerPaneProps {
  visualization: Visualization | null;
  showCode?: boolean;
  className?: string;
}

/**
 * VisualizerPane - 可视化预览面板
 *
 * 使用轻量级 iframe 渲染器替代 Sandpack，
 * 显著降低内存占用和启动时间。
 */
export function VisualizerPane({
  visualization,
  className,
}: VisualizerPaneProps) {
  return (
    <div className={cn("h-full w-full", className)}>
      <CodeRenderer
        code={visualization?.code ?? null}
        status={visualization?.status}
        error={visualization?.error}
        className="h-full"
      />
    </div>
  );
}
