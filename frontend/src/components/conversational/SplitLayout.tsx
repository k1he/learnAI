"use client";

import * as React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
  defaultLeftSize?: number;
  minLeftSize?: number;
  minRightSize?: number;
}

/**
 * Responsive split-screen layout component.
 * - Desktop: Horizontal resizable panels
 * - Mobile: Stacked vertical layout
 */
export function SplitLayout({
  leftPanel,
  rightPanel,
  className,
  defaultLeftSize = 35,
  minLeftSize = 25,
  minRightSize = 35,
}: SplitLayoutProps) {
  const isMobile = useIsMobile();

  // Mobile: Stack vertically
  if (isMobile) {
    return (
      <div className={cn("flex flex-col h-full w-full", className)}>
        <div className="flex-shrink-0 border-b border-border max-h-[50vh] overflow-auto">
          {leftPanel}
        </div>
        <div className="flex-1 overflow-hidden min-h-[300px]">
          {rightPanel}
        </div>
      </div>
    );
  }

  // Desktop: Horizontal resizable split
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className={cn("h-full w-full", className)}
    >
      <ResizablePanel
        defaultSize={defaultLeftSize}
        minSize={minLeftSize}
        className="flex flex-col"
      >
        <div className="h-full overflow-hidden">
          {leftPanel}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        minSize={minRightSize}
        className="flex flex-col"
      >
        <div className="h-full overflow-hidden">
          {rightPanel}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
