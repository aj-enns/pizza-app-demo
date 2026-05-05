const fs = require('fs');
const path = require('path');

function readVersion() {
  try {
    return fs.readFileSync(path.join(__dirname, 'VERSION'), 'utf-8').trim();
  } catch {
    return '0.0.0';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_LINT_DURING_BUILD === '0',
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_TYPECHECK_DURING_BUILD === '0',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    APP_VERSION: readVersion(),
  },
}

module.exports = nextConfig
