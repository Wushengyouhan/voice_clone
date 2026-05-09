import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 避免父目录另有 package-lock 时误判工作区根，导致 standalone 路径错误
  turbopack: {
    root: path.resolve(__dirname),
  },
  // ali-oss → urllib 会 lazy require('proxy-agent')，交给 Node 解析，避免 Turbopack 打包失败
  serverExternalPackages: ["ali-oss", "urllib", "proxy-agent"],
};

export default nextConfig;
