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
 * 1. DuckDuckGo Search (Menos bloqueios que Google na Vercel)
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

    // Estratégia 1: DuckDuckGo (Mais amigável para scrapers simples)
    try {
      const ddgGroups = await searchDuckDuckGo(keyword, 20);
      groups.push(...ddgGroups);
    } catch (err) {
      console.error('Erro no DuckDuckGo:', err);
    }

    // Estratégia 2: Diretórios Brasileiros
    try {
      const directoryGroups = await searchDirectories(keyword, 20);
      groups.push(...directoryGroups);
    } catch (err) {
      console.error('Erro nos diretórios:', err);
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
 * Busca links reais no DuckDuckGo
 */
async function searchDuckDuckGo(keyword: string, limit: number): Promise<GroupLink[]> {
  const results: GroupLink[] = [];
  const query = `site:chat.whatsapp.com "${keyword}"`;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (response.ok) {
      const html = await response.text();
      const linkRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,25}/g;
      const matches = html.match(linkRegex) || [];
      
      for (const url of Array.from(new Set(matches))) {
        results.push({
          url,
          title: `Grupo de ${keyword}`,
          description: 'Link real encontrado via DuckDuckGo',
          source: 'DuckDuckGo',
        });
      }
    }
  } catch (err) {
    console.error('Falha no fetch do DuckDuckGo:', err);
  }
  
  return results;
}

/**
 * Busca em diretórios brasileiros conhecidos
 */
async function searchDirectories(keyword: string, limit: number): Promise<GroupLink[]> {
  const results: GroupLink[] = [];
  
  const sources = [
    {
      name: 'GruposWhats.app',
      url: `https://gruposwhats.app/?s=${encodeURIComponent(keyword)}`,
    },
    {
      name: 'GruposBrasil.com.br',
      url: `https://gruposbrasil.com.br/?s=${encodeURIComponent(keyword)}`,
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.ok) {
        const html = await response.text();
        const linkRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,25}/g;
        const matches = html.match(linkRegex) || [];
        
        for (const url of Array.from(new Set(matches))) {
          results.push({
            url,
            title: `Grupo de ${keyword} (${source.name})`,
            description: `Link verificado em ${source.name}`,
            source: source.name,
          });
        }
      }
    } catch (err) {
      console.error(`Erro na fonte ${source.name}:`, err);
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}
