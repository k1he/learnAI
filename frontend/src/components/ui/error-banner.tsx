"use client";

import * as React from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Error banner/toast component for displaying API failures.
 */
export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="flex-1 text-sm text-destructive">{message}</p>
      <div className="flex items-center gap-1">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            重试
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </Button>
        )}
      </div>
    </div>
  );
}

interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

/**
 * Auto-dismissing error toast component.
 */
export function ErrorToast({
  message,
  isVisible,
  onDismiss,
  duration = 5000,
}: ErrorToastProps) {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg shadow-lg max-w-md">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-7 w-7 text-destructive-foreground hover:bg-destructive-foreground/10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </Button>
      </div>
    </div>
  );
}
