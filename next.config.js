/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'challenge',
          },
        ],
        destination: '/portal',
      },
    ]
  },
};
module.exports = nextConfig;
