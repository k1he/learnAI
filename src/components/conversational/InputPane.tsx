"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputPaneProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Input pane skeleton component.
 * Container for the chat interface and input controls.
 */
export function InputPane({ className, children }: InputPaneProps) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      className
    )}>
      {children}
    </div>
  );
}
