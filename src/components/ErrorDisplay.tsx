"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({ message, onRetry, onDismiss }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-destructive font-medium mb-1">出错了</p>
          <p className="text-sm text-muted-foreground break-words">{message}</p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重试
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                关闭
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
