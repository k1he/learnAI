"use client";

import { useState, useEffect } from "react";
import {
  Panel,
  Group,
  Separator,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface SplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
  defaultLeftSize?: number;
  minLeftSize?: number;
  minRightSize?: number;
}

export function SplitView({
  leftPanel,
  rightPanel,
  className,
  defaultLeftSize = 40,
  minLeftSize = 20,
  minRightSize = 30,
}: SplitViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: Stack vertically
  if (isMobile) {
    return (
      <div className={cn("flex flex-col h-full w-full", className)}>
        <div className="flex-shrink-0 p-4 border-b max-h-[50vh] overflow-auto">
          {leftPanel}
        </div>
        <div className="flex-1 overflow-hidden min-h-[300px]">
          {rightPanel}
        </div>
      </div>
    );
  }

  // Desktop: Horizontal split
  return (
    <Group
      orientation="horizontal"
      className={cn("h-full w-full", className)}
    >
      <Panel
        defaultSize={defaultLeftSize}
        minSize={minLeftSize}
        className="flex flex-col"
      >
        <div className="h-full overflow-auto p-4">
          {leftPanel}
        </div>
      </Panel>
      
      <Separator className="w-2 bg-border hover:bg-primary/20 transition-colors cursor-col-resize flex items-center justify-center">
        <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full" />
      </Separator>
      
      <Panel
        minSize={minRightSize}
        className="flex flex-col"
      >
        <div className="h-full overflow-hidden">
          {rightPanel}
        </div>
      </Panel>
    </Group>
  );
}
