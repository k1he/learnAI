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
    <div className={cn("h-full w-full flex flex-col", className)}>
      <div className="flex-1 min-h-0">
        <CodeRenderer
          code={visualization?.code ?? null}
          status={visualization?.status}
          error={visualization?.error}
          className="h-full"
        />
      </div>
      <div className="shrink-0 px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t text-center">
        ⚠️ AI 生成的内容可能存在错误或幻觉，请结合其他资料进行验证
      </div>
    </div>
  );
}
