import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// Cliente REST para Upstash (usado em API Routes e Services)
// Cliente REST para Upstash (usado em API Routes e Services)
// Fallback baseado em arquivo se a URL não estiver configurada para manter estado
import fs from 'fs';
import path from 'path';

const MOCK_FILE = path.join(process.cwd(), '.mock-redis.json');

function getMockData(): Record<string, any> {
  try {
    if (fs.existsSync(MOCK_FILE)) {
      const data = fs.readFileSync(MOCK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading mock redis:', e);
  }
  return {};
}

function saveMockData(data: Record<string, any>) {
  try {
    fs.writeFileSync(MOCK_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing mock redis:', e);
  }
}

export const redisRest = process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : {
  get: async (key: string) => {
    const data = getMockData();
    return data[key] || null;
  },
  set: async (key: string, value: any, options?: any) => { 
    const data = getMockData();
    data[key] = value;
    saveMockData(data);
    return "OK"; 
  },
  del: async (key: string) => { 
    const data = getMockData();
    delete data[key];
    saveMockData(data);
    return 1; 
  },
  keys: async (pattern: string) => {
    const data = getMockData();
    const prefix = pattern.replace('*', '');
    return Object.keys(data).filter(k => k.startsWith(prefix));
  },
  lpush: async (key: string, ...values: any[]) => {
    const data = getMockData();
    if (!Array.isArray(data[key])) {
      data[key] = [];
    }
    data[key].unshift(...values);
    saveMockData(data);
    return data[key].length;
  },
  lrange: async (key: string, start: number, stop: number) => {
    const data = getMockData();
    const list = data[key] || [];
    if (!Array.isArray(list)) return [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
} as unknown as Redis;

// Alias 'redis' para compatibilidade com os arquivos de serviço WhatsApp
// que importam { redis } de '../redis'
export const redis = redisRest;

// Cliente IORedis para BullMQ (conexão TCP/IP)
let redisIO: IORedis | null = null;

export function getRedisIO(): IORedis {
  if (redisIO) return redisIO;

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
