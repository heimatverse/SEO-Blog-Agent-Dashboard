import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Sanity studio from proxy/auth protection
  // (handled via proxy.ts matcher pattern)
};

export default nextConfig;
