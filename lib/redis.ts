import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// Cliente REST para Upstash (usado em API Routes)
export const redisRest = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cliente IORedis para BullMQ (conexão TCP/IP)
// Extrai host, port e password da URL REST do Upstash
let redisIO: IORedis | null = null;

export function getRedisIO(): IORedis {
  if (redisIO) return redisIO;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  
  // Parse Upstash REST URL: https://user:password@host:port
  // Para BullMQ, precisamos da conexão TCP, então usamos o endpoint IOREDIS_URL se disponível
  const ioRedisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;
  
  if (ioRedisUrl) {
    redisIO = new IORedis(ioRedisUrl);
  } else {
    // Fallback: criar instância local para desenvolvimento
    redisIO = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  return redisIO;
}

export async function closeRedisIO(): Promise<void> {
  if (redisIO) {
    await redisIO.quit();
    redisIO = null;
  }
}
