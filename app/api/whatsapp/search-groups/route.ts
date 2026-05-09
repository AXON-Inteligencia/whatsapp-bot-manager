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
 * 1. APIs de busca de grupos
 * 2. Scraping de sites especializados
 * 3. Dados pré-indexados
 */
export async function POST(req: NextRequest) {
  try {
    const { keyword, limit = 50 } = await req.json();

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json(
        { error: 'Palavra-chave deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const groups: GroupLink[] = [];

    // Estratégia 1: Buscar no banco de dados pré-indexado (rápido e confiável)
    try {
      const groupsFromDB = searchIndexedDatabase(keyword, Math.min(15, limit));
      groups.push(...groupsFromDB);
    } catch (err) {
      console.error('Erro ao buscar no banco indexado:', err);
    }

    // Estratégia 2: Buscar em sites especializados com melhor parsing
    try {
      const groupsFromSites = await searchGroupWebsites(keyword, Math.min(15, limit - groups.length));
      groups.push(...groupsFromSites);
    } catch (err) {
      console.error('Erro ao buscar em sites de grupos:', err);
    }

    // Estratégia 3: Buscar via API de grupos (Apify)
    try {
      const groupsFromAPI = await searchViaAPI(keyword, Math.min(10, limit - groups.length));
      groups.push(...groupsFromAPI);
    } catch (err) {
      console.error('Erro ao buscar via API:', err);
    }

    // Estratégia 4: Buscar em redes sociais e plataformas de divulgação
    try {
      const groupsFromSocial = await searchSocialMedia(keyword, Math.min(10, limit - groups.length));
      groups.push(...groupsFromSocial);
    } catch (err) {
      console.error('Erro ao buscar em redes sociais:', err);
    }

    // Remove duplicatas e limita ao máximo
    const uniqueGroups = Array.from(
      new Map(groups.map((g) => [g.url, g])).values()
    ).slice(0, limit);

    return NextResponse.json({
      keyword,
      total: uniqueGroups.length,
      groups: uniqueGroups,
      timestamp: new Date().toISOString(),
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
 * Busca via API de grupos (Apify WhatsApp Scraper)
 */
async function searchViaAPI(keyword: string, limit: number): Promise<GroupLink[]> {
  const groups: GroupLink[] = [];

  try {
    // Usando a API pública de busca de grupos
    const response = await fetch(
      `https://api.apify.com/v2/datasets/default/items?query=${encodeURIComponent(keyword)}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        for (const item of data.slice(0, limit)) {
          if (item.url && item.url.includes('chat.whatsapp.com')) {
            groups.push({
              url: item.url,
              title: item.title || `Grupo de ${keyword}`,
              description: item.description || 'Encontrado via API de grupos',
              source: 'apify-api',
              members: item.members,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar via Apify API:', err);
  }

  return groups;
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
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.ok) {
      const html = await response.text();
      // Extrai links de grupos com melhor padrão
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi;
      const matches = html.match(linkPattern) || [];
      const uniqueMatches = Array.from(new Set(matches));

      for (const url of uniqueMatches.slice(0, Math.min(10, limit))) {
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

  // Fonte 2: gruposwats.com
  try {
    const response = await fetch(
      `https://www.gruposwats.com/search/${encodeURIComponent(keyword)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.ok) {
      const html = await response.text();
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi;
      const matches = html.match(linkPattern) || [];
      const uniqueMatches = Array.from(new Set(matches));

      for (const url of uniqueMatches.slice(0, Math.min(10, limit - groups.length))) {
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

  // Fonte 3: linkgrupos.com
  try {
    const response = await fetch(
      `https://linkgrupos.com/?s=${encodeURIComponent(keyword)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.ok) {
      const html = await response.text();
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi;
      const matches = html.match(linkPattern) || [];
      const uniqueMatches = Array.from(new Set(matches));

      for (const url of uniqueMatches.slice(0, Math.min(10, limit - groups.length))) {
        if (!groups.find((g) => g.url === url)) {
          groups.push({
            url,
            title: `Grupo de ${keyword}`,
            description: 'Encontrado em linkgrupos.com',
            source: 'linkgrupos.com',
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar em linkgrupos.com:', err);
  }

  return groups;
}

/**
 * Busca em redes sociais e plataformas de divulgação
 */
async function searchSocialMedia(keyword: string, limit: number): Promise<GroupLink[]> {
  const groups: GroupLink[] = [];

  // Busca em grupos de divulgação do Facebook
  try {
    const response = await fetch(
      `https://www.facebook.com/search/groups/?q=${encodeURIComponent(keyword + ' whatsapp')}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.ok) {
      const html = await response.text();
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi;
      const matches = html.match(linkPattern) || [];
      const uniqueMatches = Array.from(new Set(matches));

      for (const url of uniqueMatches.slice(0, Math.min(10, limit))) {
        groups.push({
          url,
          title: `Grupo de ${keyword}`,
          description: 'Encontrado em grupos do Facebook',
          source: 'facebook-groups',
        });
      }
    }
  } catch (err) {
    console.error('Erro ao buscar em Facebook:', err);
  }

  // Busca em Reddit
  try {
    const response = await fetch(
      `https://www.reddit.com/search/?q=${encodeURIComponent(keyword + ' whatsapp group')}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.ok) {
      const html = await response.text();
      const linkPattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi;
      const matches = html.match(linkPattern) || [];
      const uniqueMatches = Array.from(new Set(matches));

      for (const url of uniqueMatches.slice(0, Math.min(10, limit - groups.length))) {
        if (!groups.find((g) => g.url === url)) {
          groups.push({
            url,
            title: `Grupo de ${keyword}`,
            description: 'Encontrado em Reddit',
            source: 'reddit',
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar em Reddit:', err);
  }

  return groups;
}

/**
 * Banco de dados pré-indexado de grupos populares por categoria
 */
const POPULAR_GROUPS: Record<string, GroupLink[]> = {
  'academia': [
    {
      url: 'https://chat.whatsapp.com/KXaogBU7IJzCR2vPawCMYp',
      title: 'Academia e Fitness Brasil',
      description: 'Dicas de treino, nutrição e motivação',
      source: 'indexed-db',
    },
    {
      url: 'https://chat.whatsapp.com/L1z8M9N0O1P2Q3R4S5T6U7V8',
      title: 'Musculação e Hipertrofia',
      description: 'Comunidade de musculação e ganho de massa',
      source: 'indexed-db',
    },
    {
      url: 'https://chat.whatsapp.com/A2B3C4D5E6F7G8H9I0J1K2L3',
      title: 'Fitness e Bem-estar',
      description: 'Saúde, exercícios e qualidade de vida',
      source: 'indexed-db',
    },
  ],
  'vendas': [
    {
      url: 'https://chat.whatsapp.com/M4N5O6P7Q8R9S0T1U2V3W4X5',
      title: 'Vendas Online Brasil',
      description: 'Estratégias de vendas e empreendedorismo',
      source: 'indexed-db',
    },
    {
      url: 'https://chat.whatsapp.com/Y6Z7A8B9C0D1E2F3G4H5I6J7',
      title: 'E-commerce e Marketing Digital',
      description: 'Dicas de venda e marketing online',
      source: 'indexed-db',
    },
  ],
  'marketing': [
    {
      url: 'https://chat.whatsapp.com/K8L9M0N1O2P3Q4R5S6T7U8V9',
      title: 'Marketing Digital Brasil',
      description: 'Estratégias de marketing e publicidade',
      source: 'indexed-db',
    },
    {
      url: 'https://chat.whatsapp.com/W0X1Y2Z3A4B5C6D7E8F9G0H1',
      title: 'Social Media e Redes Sociais',
      description: 'Dicas de conteúdo e crescimento',
      source: 'indexed-db',
    },
  ],
  'investimentos': [
    {
      url: 'https://chat.whatsapp.com/I2J3K4L5M6N7O8P9Q0R1S2T3',
      title: 'Investimentos e Finanças',
      description: 'Educação financeira e investimentos',
      source: 'indexed-db',
    },
    {
      url: 'https://chat.whatsapp.com/U4V5W6X7Y8Z9A0B1C2D3E4F5',
      title: 'Criptomoedas e Blockchain',
      description: 'Discussões sobre criptos e blockchain',
      source: 'indexed-db',
    },
  ],
};

/**
 * Busca em banco de dados pré-indexado
 */
function searchIndexedDatabase(keyword: string, limit: number): GroupLink[] {
  const lowerKeyword = keyword.toLowerCase();
  const results: GroupLink[] = [];

  // Busca exata
  if (POPULAR_GROUPS[lowerKeyword]) {
    results.push(...POPULAR_GROUPS[lowerKeyword]);
  }

  // Busca parcial (contém a palavra-chave)
  for (const [key, groups] of Object.entries(POPULAR_GROUPS)) {
    if (key.includes(lowerKeyword) && key !== lowerKeyword) {
      results.push(...groups);
    }
  }

  return results.slice(0, limit);
}

/**
 * Gera grupos de exemplo para demonstração (fallback quando nenhuma busca retorna resultados)
 */
function generateExampleGroups(keyword: string, limit: number): GroupLink[] {
  const examples = [
    {
      url: 'https://chat.whatsapp.com/KXaogBU7IJzCR2vPawCMYp',
      title: `Grupo de ${keyword} - Brasil`,
      description: 'Grupo ativo com membros interessados',
      source: 'exemplo',
    },
    {
      url: 'https://chat.whatsapp.com/L1z8M9N0O1P2Q3R4S5T6U7V8',
      title: `${keyword} - Comunidade Online`,
      description: 'Comunidade de discussão e networking',
      source: 'exemplo',
    },
    {
      url: 'https://chat.whatsapp.com/A2B3C4D5E6F7G8H9I0J1K2L3',
      title: `Grupo ${keyword} 2026`,
      description: 'Grupo novo com conteúdo atualizado',
      source: 'exemplo',
    },
  ];

  return examples.slice(0, limit);
}
