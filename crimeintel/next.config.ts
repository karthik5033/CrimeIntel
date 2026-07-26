import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['zcatalyst-sdk-node'],
  turbopack: {},
  // AppSail requires standalone output
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  productionBrowserSourceMaps: false,
  // Split output to reduce individual function size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react', 'framer-motion', 'leaflet'],
    optimizeCss: true,
  },
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
};

export default nextConfig;
