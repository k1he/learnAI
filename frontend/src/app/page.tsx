"use client";

import { useState, useCallback } from "react";
import { PromptInput } from "@/components/PromptInput";
import { SplitView } from "@/components/visualization/SplitView";
import { SandpackPreview } from "@/components/visualization/SandpackPreview";
import { ExplanationPanel } from "@/components/visualization/ExplanationPanel";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { generateVisualization } from "@/lib/api";
import { GenerationResponse } from "@/types/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>("");

  const handleSubmit = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setLastPrompt(prompt);

    try {
      const response = await generateVisualization({ prompt });
      setResult(response);
      
      if (response.status === "error") {
        setError(response.error || "生成失败，请重试");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误，请检查连接");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      handleSubmit(lastPrompt);
    }
  }, [lastPrompt, handleSubmit]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const leftContent = (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold mb-2">概念可视化</h1>
        <p className="text-muted-foreground text-sm mb-4">
          输入任何概念或问题，AI 将为你生成交互式可视化解释
        </p>
        <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {isLoading && (
        <LoadingIndicator message="AI 正在生成可视化解释，请稍候..." size="md" />
      )}

      {error && !isLoading && (
        <ErrorDisplay
          message={error}
          onRetry={lastPrompt ? handleRetry : undefined}
          onDismiss={handleDismissError}
        />
      )}

      {result?.status === "success" && result.data && !isLoading && (
        <div className="flex-1 overflow-auto">
          <ExplanationPanel explanation={result.data.explanation} />
        </div>
      )}
    </div>
  );

  const rightContent = (
    <div className="h-full flex flex-col">
      {result?.status === "success" && result.data ? (
        <SandpackPreview code={result.data.code} />
      ) : (
        <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
          <p className="text-muted-foreground text-center px-4">
            {isLoading
              ? "正在生成可视化..."
              : "输入问题后，可视化结果将显示在这里"}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <main className="h-screen w-screen overflow-hidden">
      <SplitView leftPanel={leftContent} rightPanel={rightContent} />
    </main>
  );
}
