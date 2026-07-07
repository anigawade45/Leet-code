import { getRedisConnection } from '@/lib/redis'

/**
 * Basic fixed-window rate limiter using Redis
 * @param {string} identifier - e.g., user IP or userId
 * @param {string} action - e.g., 'login', 'submission'
 * @param {number} limit - Max requests per window
 * @param {number} windowInSeconds - Window size in seconds
 * @returns {Promise<{success: boolean, current: number, remaining: number}>}
 */
export async function rateLimit(identifier, action, limit, windowInSeconds) {
  if (!identifier || !action) {
    return {
      success: true,
      current: 0,
      remaining: limit,
    }
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
    }
  } catch (error) {
    console.error('Rate limit failed, allowing request:', error)
    return {
      success: true,
      current: 0,
      remaining: limit,
    }
  }
}
