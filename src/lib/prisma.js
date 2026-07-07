import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Ensure DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl || databaseUrl.trim() === '') {
  console.error('DATABASE_URL is not set or is empty')
  throw new Error('DATABASE_URL environment variable is not properly set.')
}

// Reuse pool & prisma client during development to avoid multiple connections
const getPool = () => {
  if (global.__pgPool) return global.__pgPool
  global.__pgPool = new Pool({ connectionString: databaseUrl })
  return global.__pgPool
}

const createPrisma = () => {
  const pool = getPool()
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter, log: ['error', 'warn'] })

  // Gracefully disconnect Prisma client on process shutdown events.
  const disconnectClient = async () => {
    try {
      await client.$disconnect()
      console.info('Prisma client disconnected')
    } catch (err) {
      console.error('Error disconnecting Prisma client:', err)
    }
  }

  if (typeof process !== 'undefined' && process && process.on) {
    process.once('SIGINT', async () => {
      await disconnectClient()
      process.exit(0)
    })
    process.once('SIGTERM', async () => {
      await disconnectClient()
      process.exit(0)
    })
  }

  client.$on('error', (e) => {
    console.error('Prisma client error event:', e)
  })

  return client
}

let prisma
if (process.env.NODE_ENV === 'production') {
  prisma = createPrisma()
} else {
  // In dev with HMR/Turbopack, reuse the instance on globalThis to avoid
  // creating multiple connections which can exhaust the DB or cause
  // connection closed errors.
  if (!global.__prisma) {
    global.__prisma = createPrisma()
  }
  prisma = global.__prisma
}

export default prisma
