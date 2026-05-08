import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ali-oss → urllib 会 lazy require('proxy-agent')，交给 Node 解析，避免 Turbopack 打包失败
  serverExternalPackages: ["ali-oss", "urllib", "proxy-agent"],
};

export default nextConfig;
