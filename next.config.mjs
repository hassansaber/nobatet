/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // برای هاست اشتراکی cPanel Node 24 - standalone خروجی کم حجم تر و مناسب Passenger
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // در هاست اشتراکی ایران، همه دیتا روی هاست است - لوکال storage
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // برای sharp در Node 24
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  async headers() {
    return [
      {
        source: '/api/files/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
