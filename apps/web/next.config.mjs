const nextConfig = {
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_ORIGIN || 'http://127.0.0.1:3101'}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/v1/auth/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/:lang/(login|register|forgot-password|verify-email|reset-password)',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              source: '/:path*',
              has: [{ type: 'host', value: 'localhost' }],
              destination: 'http://127.0.0.1:3100/:path*',
              permanent: false,
            },
          ]
        : []),
      { source: '/', destination: '/ru/', permanent: true },
    ];
  },
};
export default nextConfig;
