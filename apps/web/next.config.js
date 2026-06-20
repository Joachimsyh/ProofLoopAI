/** @type {import('next').NextConfig} */
const path = require('path');

const apiUrl = process.env.API_URL?.trim() || 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/health', destination: `${apiUrl}/health` }
    ];
  }
};

module.exports = nextConfig;
