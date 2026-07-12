/**
 * Centralized environment variable validation.
 * This module runs at startup (imported by prisma.js, jwt.js, redis.js).
 * The app will REFUSE to start in production if any critical variable is absent.
 *
 * Import this module first in any file that depends on env vars so the error
 * surfaces immediately rather than failing silently at runtime.
 */

const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * Assert that a required env var is set. Throws on missing in production;
 * logs a warning in development.
 */
function requireEnv(name, description = '') {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    const msg = `[env] Missing required environment variable: ${name}${description ? ` (${description})` : ''}`
    if (IS_PROD) {
      // Hard crash — do NOT allow the app to start without this
      throw new Error(msg)
    } else {
      console.warn(`⚠️  ${msg}`)
    }
  }
  return value
}

/**
 * Assert that an env var is set and validate its format with a regex.
 */
function requireEnvMatching(name, pattern, description = '') {
  const value = requireEnv(name, description)
  if (value && !pattern.test(value)) {
    const msg = `[env] Environment variable ${name} has an invalid format.`
    if (IS_PROD) {
      throw new Error(msg)
    } else {
      console.warn(`⚠️  ${msg}`)
    }
  }
  return value
}

// ---------------------------------------------------------------------------
// Validate all critical variables at import time
// ---------------------------------------------------------------------------

// Database — must be a PostgreSQL URL with SSL enforced in production
requireEnvMatching(
  'DATABASE_URL',
  /^postgresql:\/\/.+/,
  'PostgreSQL connection string'
)

if (IS_PROD) {
  const dbUrl = process.env.DATABASE_URL || ''
  if (!dbUrl.includes('sslmode=') && !dbUrl.includes('ssl=true')) {
    throw new Error(
      '[env] DATABASE_URL in production must include SSL parameters (e.g., ?sslmode=verify-full)'
    )
  }
}

// Auth — JWT secret must be a reasonable length
const jwtSecret = requireEnv('JWT_SECRET', 'Used to sign auth tokens')
if (jwtSecret && jwtSecret.length < 32 && IS_PROD) {
  throw new Error('[env] JWT_SECRET must be at least 32 characters in production')
}

// Redis
requireEnvMatching('REDIS_URL', /^redis(s)?:\/\/.+/, 'Redis connection string')

// Email
requireEnv('RESEND_API_KEY', 'Resend transactional email API key')

// Cloudinary
requireEnv('CLOUDINARY_CLOUD_NAME', 'Cloudinary cloud name for image uploads')
requireEnv('CLOUDINARY_API_KEY', 'Cloudinary API key')
requireEnv('CLOUDINARY_API_SECRET', 'Cloudinary API secret')

// AI (optional — graceful degradation if absent, but warn loudly)
if (!process.env.GEMINI_API_KEY) {
  console.warn('[env] GEMINI_API_KEY is not set — AI analysis features will be disabled')
}

// CORS origins
if (IS_PROD && !process.env.ALLOWED_ORIGINS) {
  throw new Error('[env] ALLOWED_ORIGINS must be set in production to restrict CORS')
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  SOCKET_ORIGINS: process.env.SOCKET_ORIGINS,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD,
}
