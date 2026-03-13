import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // Prevents full barrel file imports
    optimizePackageImports: [
      '@base-ui/react',
      'lucide-react',
    ],
    // Client-side router cache: keep visited pages cached for 5 min
    // so navigating back is instant (0ms)
    staleTimes: {
      dynamic: 300, // seconds
    },
  },
};

export default nextConfig;
