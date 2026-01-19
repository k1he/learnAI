/**
 * 构建预编译的 React 运行时 bundle
 *
 * 运行方式: node scripts/build-runtime.mjs
 *
 * 生成文件:
 * - public/runtime/react.bundle.js - React + ReactDOM UMD bundle
 */

import { build } from "esbuild";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function buildReactBundle() {
  console.log("Building React runtime bundle...");

  // 创建一个临时入口文件内容
  const entryContent = `
    import * as React from 'react';
    import * as ReactDOM from 'react-dom';
    import { createRoot } from 'react-dom/client';
    import * as Recharts from 'recharts';
    import * as FramerMotion from 'framer-motion';

    // 暴露到全局
    window.React = React;
    window.ReactDOM = {
      ...ReactDOM,
      createRoot,
    };
    window.Recharts = Recharts;
    window.FramerMotion = FramerMotion;
    window.motion = FramerMotion.motion;
    window.AnimatePresence = FramerMotion.AnimatePresence;

    // 暴露常用 hooks
    window.useState = React.useState;
    window.useEffect = React.useEffect;
    window.useRef = React.useRef;
    window.useMemo = React.useMemo;
    window.useCallback = React.useCallback;
    window.useContext = React.useContext;
    window.createContext = React.createContext;

    console.log('[Runtime] React', React.version, 'loaded');
  `;

  const entryPath = join(rootDir, ".temp-entry.js");
  writeFileSync(entryPath, entryContent);

  try {
    await build({
      entryPoints: [entryPath],
      bundle: true,
      minify: true,
      format: "iife",
      target: ["es2020"],
      outfile: join(rootDir, "public/runtime/react.bundle.js"),
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    console.log("✓ React bundle created: public/runtime/react.bundle.js");

    // 清理临时文件
    const { unlinkSync } = await import("fs");
    unlinkSync(entryPath);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildReactBundle();
