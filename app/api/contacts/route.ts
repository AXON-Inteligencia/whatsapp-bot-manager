import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const CONTACTS_KEY = 'whatsapp-bot-manager:contacts';

export async function GET() {
  try {
    const contacts = await redis.get<any[]>(CONTACTS_KEY) || [];
    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contacts: newContacts } = body;

    if (!Array.isArray(newContacts)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const existing = await redis.get<any[]>(CONTACTS_KEY) || [];
    const merged = [...existing];

    for (const c of newContacts) {
      const idx = merged.findIndex((e) => e.phone === c.phone);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...c };
      } else {
        merged.push({
          id: Math.random().toString(36).substring(2, 9),
          name: c.name || 'Sem nome',
          phone: c.phone,
          email: c.email || '',
          tags: c.tags || [],
          lastContact: new Date().toISOString(),
          totalMessages: 0,
        });
      }
    }

    await redis.set(CONTACTS_KEY, merged);
    return NextResponse.json({ message: `${newContacts.length} contatos importados`, total: merged.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const contacts = await redis.get<any[]>(CONTACTS_KEY) || [];
    const updated = contacts.filter((c) => c.id !== id);
    await redis.set(CONTACTS_KEY, updated);
    return NextResponse.json({ message: 'Contato removido' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
