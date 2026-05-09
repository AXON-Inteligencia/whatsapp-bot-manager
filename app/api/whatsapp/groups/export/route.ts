import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';

export async function POST(req: NextRequest) {
  try {
    const { botId, groupId, groupName } = await req.json();

    if (!botId || !groupId) {
      return NextResponse.json({ error: 'botId e groupId são obrigatórios' }, { status: 400 });
    }

    const members = await WhatsAppService.getGroupMembers(botId, groupId);

    // Gera CSV com BOM para compatibilidade com Excel
    const headers = ['Nome', 'Telefone', 'WhatsApp ID', 'Função', 'Admin'];
    const rows = members.map((m: any) => [
      m.phone,
      '+' + m.phone.replace(/\D/g, ''),
      m.id,
      m.role || 'member',
      m.isAdmin ? 'Sim' : 'Não',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const filename = `membros_${(groupName || groupId).replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
