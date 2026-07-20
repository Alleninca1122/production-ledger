import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 忽略 TypeScript 编译错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略 ESLint 检查错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;