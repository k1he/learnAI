"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExplanationPanelProps {
  explanation: string;
  className?: string;
}

export function ExplanationPanel({ explanation, className }: ExplanationPanelProps) {
  if (!explanation) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-primary"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          概念解释
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
