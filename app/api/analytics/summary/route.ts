import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Analytics: Hoje
    const { rows: todayRows } = await sql`
      SELECT routed_to, COUNT(*) as count 
      FROM conversation_logs 
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY routed_to
    `;

    // Analytics: Semana
    const { rows: weekRows } = await sql`
      SELECT routed_to, COUNT(*) as count 
      FROM conversation_logs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY routed_to
    `;

    // Analytics: Mês
    const { rows: monthRows } = await sql`
      SELECT routed_to, COUNT(*) as count 
      FROM conversation_logs 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY routed_to
    `;

    const { rows: avgRows } = await sql`
      SELECT AVG(message_count) as avg_msgs FROM conversation_logs
    `;

    const parseCounts = (rows: any[]) => {
      let total = 0, sales = 0, support = 0;
      for (const row of rows) {
        const c = parseInt(row.count) || 0;
        total += c;
        if (row.routed_to === 'sales') sales += c;
        if (row.routed_to === 'support') support += c;
      }
      return { total, sales, support };
    };

    return NextResponse.json({
      today: parseCounts(todayRows),
      week: parseCounts(weekRows),
      month: parseCounts(monthRows),
      avgMessagesPerConversation: parseFloat(avgRows[0]?.avg_msgs || 0).toFixed(1)
    });
  } catch (error: any) {
    console.error('[Analytics API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
