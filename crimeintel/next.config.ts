import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['zcatalyst-sdk-node'],
  output: 'standalone',
  turbopack: {
    root: projectRoot,
  },
  // Optimize bundle size for Catalyst deployment
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  async headers() {
    return [
      {
        source: "/seed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
        ],
      },
    ];
  },
  // Reduce build artifact size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react'],
  },
};

export default nextConfig;
