import fetch from 'node-fetch';

export class TelegramScraperService {
  /**
   * Extrai links de grupos do Telegram com base em uma palavra-chave
   */
  async extractGroupsByKeyword(keyword: string): Promise<string[]> {
    const links: Set<string> = new Set();
    
    // Na Fase 1, usaremos uma busca em diretórios públicos conhecidos ou DuckDuckGo HTML
    try {
      const searchQuery = encodeURIComponent(`site:t.me/joinchat "${keyword}"`);
      // URL do DuckDuckGo Lite (HTML) para evitar bloqueio de JS
      const url = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      const html = await response.text();

      // Expressão regular para achar links t.me
      const regex = /(?:https?:\/\/)?(?:www\.)?t\.me\/(?:joinchat\/)?[a-zA-Z0-9_-]+/g;
      const matches = html.match(regex);

      if (matches) {
        matches.forEach(link => {
          // Normaliza o link
          links.add(link.replace('http://', 'https://'));
        });
      }
    } catch (err) {
      console.error('[Scraper] Erro ao buscar links:', err);
    }

    return Array.from(links);
  }
}

export const telegramScraper = new TelegramScraperService();
