"use client";

import { PlusCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onNewChat: () => void;
  onOpenHistory?: () => void;
  className?: string;
}

/**
 * Header component with app title and action buttons.
 */
export function Header({
  onNewChat,
  onOpenHistory,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-border bg-background",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Concept Canvas</h1>
      </div>

      <div className="flex items-center gap-2">
        {onOpenHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="gap-1.5"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">历史</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">新对话</span>
        </Button>
      </div>
    </header>
  );
}
