/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize images
  images: {
    domains: [
      'graph.microsoft.com', // Microsoft Graph API for user profile pictures
      'recruiter-f.rnd.2bv.io', // Your domain
      'localhost' // For development
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.testdome.com https://api.teamtailor.com https://graph.microsoft.com https://login.microsoftonline.com",
              "frame-src 'self' https://login.microsoftonline.com"
            ].join('; ')
          }
        ]
      }
    ];
  },
  
  // Rewrites for API routing
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health'
      }
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add support for importing .md files
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader'
    });
    
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': '@sentry/browser',
      };
    }
    
    return config;
  },
  
  // Experimental features
  experimental: {
    // Enable app directory features
    appDir: true,
    // Optimize server components
    serverComponentsExternalPackages: ['@azure/msal-node']
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/users',
        permanent: false
      }
    ];
  },
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Generate etags
  generateEtags: true,
  
  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // React strict mode
  reactStrictMode: true,
  
  // SWC minification
  swcMinify: true,
}

module.exports = nextConfig;