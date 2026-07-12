/** @type {import('next').NextConfig} */

const IS_PROD = process.env.NODE_ENV === 'production'

// The first origin in ALLOWED_ORIGINS is used as the Access-Control-Allow-Origin header
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean)
  : ['http://localhost:3000']

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline and unsafe-eval.
  // Monaco Editor loads its web workers and helper scripts from jsdelivr CDN.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https:",
  // Allow WebSockets connections to local and Render endpoints
  "connect-src 'self' http://localhost:3001 ws://localhost:3001 wss://leet-code-9v9m.onrender.com https://leet-code-9v9m.onrender.com https://api.resend.com wss://*.onrender.com ws: wss: http: https:",
  // Allow Monaco Editor workers initialized from blob URLs
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig = {
  devIndicators: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking protection
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME-sniffing protection
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer info — omit cross-origin paths
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features the app doesn't need
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          // X-XSS-Protection is obsolete; set to 0 to disable legacy mode that can be bypassed
          { key: 'X-XSS-Protection', value: '0' },
          // CORS — restrict to configured origins
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-Requested-With' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins[0] },
          { key: 'Vary', value: 'Origin' },
          // Content Security Policy — applied in all environments
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          // HSTS — 1 year, include subdomains, eligible for preload list
          // Note: Only effective over HTTPS; browsers ignore it over HTTP
          {
            key: 'Strict-Transport-Security',
            value: IS_PROD
              ? 'max-age=31536000; includeSubDomains; preload'
              : 'max-age=0', // Don't cache HSTS in dev (avoids locking localhost to HTTPS)
          },
        ],
      },
    ]
  },
}

export default nextConfig;
