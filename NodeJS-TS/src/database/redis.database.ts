import { createClient, RedisClientType } from 'redis'
import { config } from 'dotenv'

config()

let redisClient: RedisClientType | null = null

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  })

  redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err))
  redisClient.on('connect', () => console.log('✅ Connected to Redis!'))

  await redisClient.connect()
  return redisClient
}

