import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@ai-sdk/mcp",
    "@modelcontextprotocol/sdk",
    "@corsair-dev/mcp",
  ],
};

export default nextConfig;
