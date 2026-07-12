import { Server } from 'socket.io'
import http from 'http'
import Redis from 'ioredis'

// Use existing redis config but create a dedicated connection for subscriber
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const subscriber = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 20,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
})

const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

const server = http.createServer()
const allowedOrigins = process.env.SOCKET_ORIGINS
  ? process.env.SOCKET_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:3000']

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Origin not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
})

function log(msg) {
  if (!IS_PROD) console.log(msg)
}

async function initializeRedisSubscriber() {
  subscriber.on('error', (err) => {
    console.error('[SocketServer] Redis error:', err.message)
  })

  try {
    await subscriber.connect()
    await subscriber.subscribe('socket:broadcast')
    log('[SocketServer] Subscribed successfully to socket:broadcast')
  } catch (err) {
    console.error('[SocketServer] Failed to subscribe to Redis:', err.message)
  }
}

initializeRedisSubscriber()

subscriber.on('message', (channel, message) => {
  if (channel === 'socket:broadcast') {
    try {
      const data = JSON.parse(message)
      const { event, room, payload } = data
      
      if (room) {
        io.to(room).emit(event, payload)
        log(`[SocketServer] Broadcasted event '${event}' to room '${room}'`)
      } else {
        io.emit(event, payload)
        log(`[SocketServer] Broadcasted global event '${event}'`)
      }
    } catch (e) {
      console.error('[SocketServer] Error parsing message:', e.message)
    }
  }
})

io.on('connection', (socket) => {
  log(`[SocketServer] Client connected: ${socket.id}`)

  socket.on('join-room', (room) => {
    socket.join(room)
    log(`[SocketServer] Socket ${socket.id} joined room: ${room}`)
  })

  socket.on('leave-room', (room) => {
    socket.leave(room)
    log(`[SocketServer] Socket ${socket.id} left room: ${room}`)
  })

  socket.on('disconnect', () => {
    log(`[SocketServer] Client disconnected: ${socket.id}`)
  })
})

server.listen(PORT, () => {
  console.info(`[SocketServer] Socket.IO server running on port ${PORT}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('[SocketServer] Unhandled promise rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[SocketServer] Uncaught exception:', err.message)
  process.exit(1)
})
