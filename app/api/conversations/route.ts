import { NextRequest, NextResponse } from 'next/server';
import { redisRest } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const keys = await redisRest.keys('axon:conversations:*');
    if (!keys || keys.length === 0) {
      return NextResponse.json([]);
    }

    const conversations = await Promise.all(
      keys.map(async (key) => {
        const conv = await redisRest.get(key);
        return conv;
      })
    );

    // Order by timestamp descending (newest first)
    conversations.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
