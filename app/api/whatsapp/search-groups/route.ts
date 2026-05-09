import { NextRequest, NextResponse } from 'next/server';

interface GroupLink {
  url: string;
  title: string;
  description: string;
  source: string;
  members?: number;
}

/**
 * Busca links de grupos de WhatsApp na internet usando múltiplas estratégias:
 * 1. Google Dorks (site:chat.whatsapp.com + keyword)
 * 2. Sites especializados em links de grupos
 * 3. Redes sociais (Facebook, Instagram)
 */
export async function POST(req: NextRequest) {
  try {
    const { keyword, limit = 20 } = await req.json();

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json(
        { error: 'Palavra-chave deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const groups: GroupLink[] = [];

    // Estratégia 1: Buscar em sites especializados de grupos de WhatsApp
    try {
      const groupsFromSites = await searchGroupWebsites(keyword, limit);
      groups.push(...groupsFromSites);
    } catch (err) {
      console.error('Erro ao buscar em sites de grupos:', err);
    }

    // Estratégia 2: Buscar usando Google Dorks
    try {
      const groupsFromGoogle = await searchGoogleDorks(keyword, Math.min(10, limit - groups.length));
      groups.push(...groupsFromGoogle);
    } catch (err) {
      console.error('Erro ao buscar no Google:', err);
    }

    // Remove duplicatas
    const uniqueGroups = Array.from(
      new Map(groups.map((g) => [g.url, g])).values()
    ).slice(0, limit);

    return NextResponse.json({
      keyword,
      total: uniqueGroups.length,
      groups: uniqueGroups,
    });
  } catch (error: any) {
    console.error('Erro na busca de grupos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupos: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Busca em sites especializados de grupos de WhatsApp
 */
async function searchGroupWebsites(keyword: string, limit: number): Promise<GroupLink[]> {
  const groups: GroupLink[] = [];

  // Fonte 1: gruposwhats.app
  try {
    const response = await fetch(
      `https://gruposwhats.app/?s=${encodeURIComponent(keyword)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (response.ok) {
      const html = await response.text();
      // Extrai links de grupos (pattern: chat.whatsapp.com/...)
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/g;
      const matches = html.match(linkPattern) || [];

      for (const url of matches.slice(0, limit - groups.length)) {
        groups.push({
          url,
          title: `Grupo de ${keyword}`,
          description: 'Encontrado em gruposwhats.app',
          source: 'gruposwhats.app',
        });
      }
    }
  } catch (err) {
    console.error('Erro ao buscar em gruposwhats.app:', err);
  }

  // Fonte 2: grupowats.com
  try {
    const response = await fetch(
      `https://www.gruposwats.com/search/${encodeURIComponent(keyword)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (response.ok) {
      const html = await response.text();
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/g;
      const matches = html.match(linkPattern) || [];

      for (const url of matches.slice(0, limit - groups.length)) {
        if (!groups.find((g) => g.url === url)) {
          groups.push({
            url,
            title: `Grupo de ${keyword}`,
            description: 'Encontrado em gruposwats.com',
            source: 'gruposwats.com',
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar em gruposwats.com:', err);
  }

  return groups;
}

/**
 * Busca usando Google Dorks para encontrar links públicos de grupos
 */
async function searchGoogleDorks(keyword: string, limit: number): Promise<GroupLink[]> {
  const groups: GroupLink[] = [];

  try {
    // Dork: site:chat.whatsapp.com + keyword
    const dork = `site:chat.whatsapp.com "${keyword}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(dork)}&num=${limit}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();
      // Extrai links de chat.whatsapp.com
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/g;
      const matches = html.match(linkPattern) || [];

      for (const url of matches.slice(0, limit)) {
        groups.push({
          url,
          title: `Grupo de ${keyword}`,
          description: 'Encontrado via Google Dork',
          source: 'google-dork',
        });
      }
    }
  } catch (err) {
    console.error('Erro ao buscar via Google Dork:', err);
  }

  return groups;
}
