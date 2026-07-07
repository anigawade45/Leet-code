import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  console.warn('REDIS_URL is not set in production; Redis connections will be deferred until runtime.')
}

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
})

redisConnection.on('error', (error) => {
  console.error('Redis connection error:', error)
})

export async function getRedisConnection() {
  if (!redisConnection.status || redisConnection.status === 'end') {
    try {
      await redisConnection.connect()
    } catch (error) {
      console.error('Redis failed to connect:', error)
    }
  }
  return redisConnection
}

export default redisConnection
