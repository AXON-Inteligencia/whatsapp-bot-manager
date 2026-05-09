import { NextRequest, NextResponse } from 'next/server';

interface GroupLink {
  url: string;
  title: string;
  description: string;
  source: string;
  members?: number;
}

/**
 * Busca links de grupos de WhatsApp reais na internet.
 * Estratégia: 
 * 1. Google Search via API (Serper.dev ou similar) - Evita bloqueios de IP
 * 2. Diretórios de grupos brasileiros (gruposwhats.app, gruposbrasil.com.br)
 * 3. Validação de formato de link
 */
export async function POST(req: NextRequest) {
  try {
    const { keyword, limit = 30 } = await req.json();

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json(
        { error: 'Palavra-chave deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const groups: GroupLink[] = [];

    // Estratégia 1: Google Search via API (Usando uma chave de API gratuita ou fallback)
    // Como não temos chave de API aqui, vamos usar um scraper mais robusto com rotação de headers
    try {
      const searchResults = await searchRobust(keyword, 30);
      groups.push(...searchResults);
    } catch (err) {
      console.error('Erro na busca robusta:', err);
    }

    // Filtro de segurança e remoção de duplicatas
    const uniqueGroups = Array.from(
      new Map(
        groups
          .filter(g => g.url.includes('chat.whatsapp.com/'))
          .map((g) => [g.url, g])
      ).values()
    ).slice(0, limit);

    return NextResponse.json({
      keyword,
      total: uniqueGroups.length,
      groups: uniqueGroups,
    });
  } catch (error: any) {
    console.error('Erro crítico na busca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar busca: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Busca links reais usando múltiplas fontes e headers rotativos
 */
async function searchRobust(keyword: string, limit: number): Promise<GroupLink[]> {
  const results: GroupLink[] = [];
  const query = `site:chat.whatsapp.com "${keyword}"`;
  
  // Lista de URLs de busca para tentar
  const searchUrls = [
    `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${limit}`,
    `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`,
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://gruposwhats.app/?s=${encodeURIComponent(keyword)}`,
    `https://gruposbrasil.com.br/?s=${encodeURIComponent(keyword)}`
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  ];

  // Tenta cada fonte até conseguir resultados suficientes
  for (const url of searchUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        next: { revalidate: 3600 } // Cache de 1 hora
      });

      if (response.ok) {
        const html = await response.text();
        const linkRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,25}/g;
        const matches = html.match(linkRegex) || [];
        
        for (const match of Array.from(new Set(matches))) {
          if (!results.find(r => r.url === match)) {
            results.push({
              url: match,
              title: `Grupo de ${keyword}`,
              description: `Link real encontrado em ${new URL(url).hostname}`,
              source: new URL(url).hostname,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Falha ao buscar em ${url}:`, err);
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}
