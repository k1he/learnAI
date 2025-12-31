"use client";

import { useMemo } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview as SandpackPreviewPane,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";

interface SandpackPreviewProps {
  code: string;
  showCode?: boolean;
}

export function SandpackPreview({ code, showCode = false }: SandpackPreviewProps) {
  const files = useMemo(() => {
    if (!code) return null;
    return {
      "/App.js": code,
      "/index.js": `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
      `.trim(),
    };
  }, [code]);

  if (!code || !files) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg p-4">
        <p className="text-muted-foreground">等待生成代码...</p>
      </div>
    );
  }

  return (
    <SandpackProvider
      template="react"
      files={files}
      customSetup={{
        dependencies: {
          recharts: "^2.10.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
      }}
      options={{
        externalResources: [],
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
    >
      <SandpackLayout>
        {showCode && (
          <SandpackCodeEditor
            style={{ height: "100%", minHeight: "300px" }}
            showTabs
            showLineNumbers
          />
        )}
        <SandpackPreviewPane
          style={{ height: "100%", minHeight: "400px" }}
          showOpenInCodeSandbox={false}
          showRefreshButton
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
