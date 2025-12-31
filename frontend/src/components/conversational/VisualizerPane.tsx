"use client";

import * as React from "react";
import { useMemo, Component, type ReactNode } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Visualization } from "@/types/conversation";

/**
 * Error Boundary for Sandpack renderer.
 * Catches runtime errors in the preview and displays a fallback UI.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SandpackErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Sandpack Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full bg-destructive/5 rounded-lg p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">渲染错误</h3>
          <p className="text-muted-foreground text-sm text-center mb-4 max-w-md">
            可视化组件加载失败。这可能是由于生成的代码存在问题。
          </p>
          <Button variant="outline" onClick={this.handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface VisualizerPaneProps {
  visualization: Visualization | null;
  showCode?: boolean;
  className?: string;
}

/**
 * Sandpack wrapper component for rendering visualizations.
 * Displays the generated React code in an interactive preview.
 */
export function VisualizerPane({
  visualization,
  showCode = false,
  className,
}: VisualizerPaneProps) {
  const [key, setKey] = React.useState(0);
  
  const files = useMemo(() => {
    if (!visualization?.code) return null;

    return {
      "/App.js": visualization.code,
      "/index.js": `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
      `.trim(),
    };
  }, [visualization?.code]);

  const handleErrorReset = () => {
    setKey(prev => prev + 1);
  };

  // Loading state
  if (visualization?.status === "loading") {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-muted/30 rounded-lg",
        className
      )}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">正在生成可视化...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (visualization?.status === "error") {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-destructive/10 rounded-lg p-4",
        className
      )}>
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium mb-2">生成失败</p>
          <p className="text-muted-foreground text-sm max-w-md">
            {visualization.error || "请重试或修改您的请求"}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!visualization?.code || !files) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-muted/30 rounded-lg p-4",
        className
      )}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">
            输入问题后，可视化结果将显示在这里
          </p>
        </div>
      </div>
    );
  }

  // Success state - render Sandpack with Error Boundary
  return (
    <div className={cn("h-full w-full", className)}>
      <SandpackErrorBoundary key={key} onReset={handleErrorReset}>
        <SandpackProvider
          template="react"
          files={files}
          customSetup={{
            dependencies: {
              recharts: "^2.10.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "lucide-react": "^0.400.0",
              "framer-motion": "^11.0.0",
              clsx: "^2.1.0",
              "tailwind-merge": "^2.2.0",
            },
          }}
          options={{
            externalResources: [],
            recompileMode: "delayed",
            recompileDelay: 500,
          }}
          theme="auto"
        >
          <SandpackLayout className="h-full">
            {showCode && (
              <SandpackCodeEditor
                style={{ height: "100%", minHeight: "300px" }}
                showTabs
                showLineNumbers
              />
            )}
            <SandpackPreview
              style={{ height: "100%", minHeight: "400px" }}
              showOpenInCodeSandbox={false}
              showRefreshButton
            />
          </SandpackLayout>
        </SandpackProvider>
      </SandpackErrorBoundary>
    </div>
  );
}
