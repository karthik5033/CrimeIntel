import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['zcatalyst-sdk-node'],
  turbopack: {},
  // CRITICAL: Reduce serverless function size for Catalyst Slate
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  productionBrowserSourceMaps: false,
  // Split output to reduce individual function size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react', 'framer-motion', 'leaflet'],
    // Aggressive code splitting for serverless functions
    optimizeCss: true,
  },
  // Reduce bundle size with modularizeImports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
    'recharts': {
      transform: 'recharts/es6/{{member}}',
    },
  },
  // Output config to optimize for OpenNext (used by Catalyst)
  outputFileTracing: true,
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
