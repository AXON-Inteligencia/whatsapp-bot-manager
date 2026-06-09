import { NextRequest, NextResponse } from 'next/server';
import { redisRest } from '@/lib/redis';

interface Member {
  id: string;
  phone: string;
  isAdmin: boolean;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const { members, groupName, tags = [] } = await req.json();

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'Lista de membros inválida' }, { status: 400 });
    }

    // Validar estrutura dos membros
    const validMembers = members.filter((m: any) => m.phone);

    if (validMembers.length === 0) {
      return NextResponse.json({ error: 'Nenhum membro válido' }, { status: 400 });
    }

    // Preparar contatos para importação
    const contacts = validMembers.map((member: Member) => ({
      phone: member.phone,
      name: `${groupName} - ${member.isAdmin ? 'Admin' : 'Membro'}`,
      tags: [...tags, groupName, member.isAdmin ? 'admin' : 'member'],
      source: 'group_extraction',
      extractedAt: new Date().toISOString(),
    }));

    // Registrar importação no Redis
    await redisRest.lpush('contact_imports', JSON.stringify({
      timestamp: new Date().toISOString(),
      groupName,
      count: contacts.length,
      adminCount: validMembers.filter((m: Member) => m.isAdmin).length,
    }));

    return NextResponse.json({
      message: 'Contatos prontos para importação',
      count: contacts.length,
      contacts,
    });
  } catch (error: any) {
    console.error('Erro ao processar membros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
