import redisConnection from '@/lib/redis.js'
import crypto from 'crypto'

export const NotificationService = {
  async addNotification(userId, title, message, type = 'info', link = null) {
    const notification = {
      id: crypto.randomUUID(),
      title,
      message,
      type, // 'info', 'success', 'warning'
      link,
      createdAt: new Date().toISOString(),
      read: false
    }

    const key = `notifications:${userId}`
    
    // Push to the left (newest first)
    await redisConnection.lpush(key, JSON.stringify(notification))
    // Keep only the latest 50
    await redisConnection.ltrim(key, 0, 49)

    // Broadcast to connected socket
    try {
      const payload = {
        event: 'notification:new',
        room: `user:${userId}`,
        payload: notification
      }
      await redisConnection.publish('socket:broadcast', JSON.stringify(payload))
    } catch (e) {
      console.error('[NotificationService] Failed to publish notification:', e)
    }

    return notification
  },

  async getNotifications(userId) {
    const key = `notifications:${userId}`
    const data = await redisConnection.lrange(key, 0, -1)
    return data.map(n => JSON.parse(n))
  },

  async clearNotifications(userId) {
    const key = `notifications:${userId}`
    await redisConnection.del(key)
  }
}
