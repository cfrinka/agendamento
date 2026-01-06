import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {},
};

export default nextConfig;
