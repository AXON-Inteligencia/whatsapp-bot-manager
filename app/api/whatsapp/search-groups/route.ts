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
 * 1. Google Search (via scraping direto com User-Agent rotativo)
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

    // Estratégia 1: Google Search Dorks (A fonte mais real de links indexados)
    try {
      const googleGroups = await searchGoogleReal(keyword, 20);
      groups.push(...googleGroups);
    } catch (err) {
      console.error('Erro no Google Search:', err);
    }

    // Estratégia 2: Diretórios Brasileiros (Links verificados por humanos)
    try {
      const directoryGroups = await searchDirectories(keyword, 20);
      groups.push(...directoryGroups);
    } catch (err) {
      console.error('Erro nos diretórios:', err);
    }

    // Filtro de segurança: Garante que o link é do WhatsApp e remove duplicatas
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
 * Busca links reais no Google usando Dorks
 */
async function searchGoogleReal(keyword: string, limit: number): Promise<GroupLink[]> {
  const results: GroupLink[] = [];
  const dork = `site:chat.whatsapp.com "${keyword}"`;
  
  // Usamos o buscador do Google via fetch com um User-Agent de navegador real
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(dork)}&num=${limit * 2}`;
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (response.ok) {
      const html = await response.text();
      
      // Regex para capturar links de grupos do WhatsApp
      const linkRegex = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,25}/g;
      const matches = html.match(linkRegex) || [];
      
      // Tenta extrair títulos dos snippets do Google (simplificado)
      const uniqueLinks = Array.from(new Set(matches));
      
      for (const url of uniqueLinks) {
        results.push({
          url,
          title: `Grupo de ${keyword} (Google)`,
          description: 'Link indexado publicamente no Google',
          source: 'Google Search',
        });
      }
    }
  } catch (err) {
    console.error('Falha no fetch do Google:', err);
  }
  
  return results;
}

/**
 * Busca em diretórios brasileiros conhecidos
 */
async function searchDirectories(keyword: string, limit: number): Promise<GroupLink[]> {
  const results: GroupLink[] = [];
  
  // Lista de diretórios para varrer
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
            description: `Encontrado no diretório ${source.name}`,
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
