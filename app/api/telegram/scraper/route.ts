import { NextResponse } from 'next/server';
import { telegramScraper } from '@/lib/telegram/scraper';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json({ success: false, error: 'Palavra-chave é obrigatória' }, { status: 400 });
    }

    const links = await telegramScraper.extractGroupsByKeyword(keyword);

    return NextResponse.json({
      success: true,
      data: links,
      count: links.length
    });
  } catch (error: any) {
    console.error('[Scraper API Error]', error);
    return NextResponse.json({ success: false, error: 'Erro interno ao buscar grupos' }, { status: 500 });
  }
}
