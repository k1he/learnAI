import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 优化生产构建
  reactStrictMode: true,

  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // 配置外部包（不进行服务端打包）
  serverExternalPackages: ["sucrase"],

  // Turbopack 开发模式（更快的 HMR）
  // 如果遇到兼容性问题可以注释掉
  // turbopack: {},
};

export default nextConfig;
