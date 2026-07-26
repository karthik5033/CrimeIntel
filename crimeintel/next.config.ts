import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['zcatalyst-sdk-node'],
  
  // AppSail requires standalone output
  output: 'standalone',
  
  // Fix standalone output directory structure - set to project root
  outputFileTracingRoot: path.join(__dirname),
  
  // Fix standalone output directory structure
  distDir: '.next',
  
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  productionBrowserSourceMaps: false,
  
  // Split output to reduce individual function size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react', 'framer-motion', 'leaflet'],
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
