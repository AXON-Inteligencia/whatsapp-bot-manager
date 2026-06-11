import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const { data: todayLogs } = await supabase
      .from('conversation_logs')
      .select('routed_to')
      .gte('created_at', today.toISOString());

    const { data: weekLogs } = await supabase
      .from('conversation_logs')
      .select('routed_to')
      .gte('created_at', weekAgo.toISOString());

    const { data: monthLogs } = await supabase
      .from('conversation_logs')
      .select('routed_to')
      .gte('created_at', monthAgo.toISOString());

    const { data: allLogs } = await supabase
      .from('conversation_logs')
      .select('message_count');

    const parseCounts = (rows: any[]) => {
      let total = 0, sales = 0, support = 0;
      if (!rows) return { total, sales, support };
      for (const row of rows) {
        total += 1;
        if (row.routed_to === 'sales') sales += 1;
        if (row.routed_to === 'support') support += 1;
      }
      return { total, sales, support };
    };

    let avgMsgs = 0;
    if (allLogs && allLogs.length > 0) {
      const sum = allLogs.reduce((acc, log) => acc + (log.message_count || 0), 0);
      avgMsgs = sum / allLogs.length;
    }

    return NextResponse.json({
      today: parseCounts(todayLogs || []),
      week: parseCounts(weekLogs || []),
      month: parseCounts(monthLogs || []),
      avgMessagesPerConversation: avgMsgs.toFixed(1)
    });
  } catch (error: any) {
    console.error('[Analytics API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
