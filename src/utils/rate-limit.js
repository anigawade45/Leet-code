import { getRedisConnection } from '@/lib/redis'

// Load threshold configurations from env vars with production-ready defaults
const CONFIG = {
  // Auth endpoints (strict)
  AUTH_LIMIT: Number(process.env.RATE_LIMIT_AUTH_LIMIT || 5),
  AUTH_WINDOW: Number(process.env.RATE_LIMIT_AUTH_WINDOW || 60),

  // Public/Unauthenticated endpoints (moderate)
  PUBLIC_LIMIT: Number(process.env.RATE_LIMIT_PUBLIC_LIMIT || 30),
  PUBLIC_WINDOW: Number(process.env.RATE_LIMIT_PUBLIC_WINDOW || 60),

  // Authenticated user actions (loose)
  USER_LIMIT: Number(process.env.RATE_LIMIT_USER_LIMIT || 100),
  USER_WINDOW: Number(process.env.RATE_LIMIT_USER_WINDOW || 60),
}

/**
 * Enhanced rate limiter using Redis supporting configurable thresholds
 * and window durations.
 * 
 * @param {string} identifier - unique key to rate limit (e.g. IP or userId)
 * @param {string} action - action label (e.g. 'login', 'register', 'public-fetch')
 * @param {string} tier - 'auth', 'public', or 'user' configuration tier
 * @returns {Promise<{success: boolean, current: number, remaining: number, limit: number}>}
 */
export async function rateLimit(identifier, action, tier = 'user') {
  if (!identifier || !action) {
    return { success: true, current: 0, remaining: 1, limit: 1 }
  }

  // Resolve config limits based on configured tier
  let limit = CONFIG.USER_LIMIT
  let windowInSeconds = CONFIG.USER_WINDOW

  if (tier === 'auth') {
    limit = CONFIG.AUTH_LIMIT
    windowInSeconds = CONFIG.AUTH_WINDOW
  } else if (tier === 'public') {
    limit = CONFIG.PUBLIC_LIMIT
    windowInSeconds = CONFIG.PUBLIC_WINDOW
  }

  const key = `rate-limit:${action}:${identifier}`

  try {
    const redisClient = await getRedisConnection()
    const current = await redisClient.incr(key)
    if (current === 1) {
      await redisClient.expire(key, windowInSeconds)
    }

    return {
      success: current <= limit,
      current,
      remaining: Math.max(0, limit - current),
      limit,
    }
  } catch (error) {
    console.error('Rate limit execution failed, allowing request:', error)
    return {
      success: true,
      current: 0,
      remaining: limit,
      limit,
    }
  }
}

/**
 * Exponential backoff tracker for auth failures.
 * Records failed attempts and returns a dynamic cooldown duration.
 * 
 * @param {string} identifier - unique identifier (e.g. username/email or IP)
 * @param {string} action - e.g. 'login'
 * @param {boolean} isFailure - if this request was a failure (to increment count)
 * @returns {Promise<{blocked: boolean, remainingCooldown: number}>}
 */
export async function handleAuthBackoff(identifier, action, isFailure = false) {
  if (!identifier) return { blocked: false, remainingCooldown: 0 }

  const failCountKey = `auth-fail-count:${action}:${identifier}`
  const blockUntilKey = `auth-block-until:${action}:${identifier}`

  try {
    const redisClient = await getRedisConnection()

    // 1. Check if user is currently in a backoff cooldown window
    const blockedUntilVal = await redisClient.get(blockUntilKey)
    if (blockedUntilVal) {
      const now = Date.now()
      const blockedUntil = Number(blockedUntilVal)
      if (now < blockedUntil) {
        return {
          blocked: true,
          remainingCooldown: Math.ceil((blockedUntil - now) / 1000),
        }
      }
    }

    // 2. Increment failed attempts counter if failure occurred
    if (isFailure) {
      const failures = await redisClient.incr(failCountKey)
      // Reset counter window after 30 minutes of no attempts
      await redisClient.expire(failCountKey, 1800)

      // Calculate exponential cooldown (e.g. 3 consecutive failures = 10s, 4 = 30s, 5 = 90s, max 1 hour)
      if (failures >= 3) {
        const baseMultiplier = Number(process.env.AUTH_BACKOFF_BASE || 10) // default 10 seconds
        const seconds = Math.min(
          baseMultiplier * Math.pow(3, failures - 3),
          3600 // max 1 hour backoff
        )
        const blockUntil = Date.now() + seconds * 1000
        await redisClient.set(blockUntilKey, blockUntil, 'EX', seconds)
        return { blocked: true, remainingCooldown: seconds }
      }
    }

    return { blocked: false, remainingCooldown: 0 }
  } catch (error) {
    console.error('Auth backoff handling failed:', error)
    return { blocked: false, remainingCooldown: 0 }
  }
}

/**
 * Reset the exponential backoff tracking on a successful login/auth event.
 * 
 * @param {string} identifier - username/email or IP
 * @param {string} action - e.g. 'login'
 */
export async function resetAuthBackoff(identifier, action) {
  if (!identifier) return
  const failCountKey = `auth-fail-count:${action}:${identifier}`
  const blockUntilKey = `auth-block-until:${action}:${identifier}`
  try {
    const redisClient = await getRedisConnection()
    await redisClient.del(failCountKey, blockUntilKey)
  } catch (error) {
    console.error('Failed to reset auth backoff:', error)
  }
}
