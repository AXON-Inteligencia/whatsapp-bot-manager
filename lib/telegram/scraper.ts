import fetch from 'node-fetch';
import * as cheerio from 'cheerio'; // Make sure cheerio is installed or use regex

export class TelegramScraperService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];

  private getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private extractLinksFromText(text: string): string[] {
    const links: string[] = [];
    const regex = /(?:https?:\/\/)?(?:www\.)?t\.me\/(?:joinchat\/|\+)[a-zA-Z0-9_-]+/g;
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(link => {
        links.push(link.replace('http://', 'https://'));
      });
    }
    return links;
  }

  private async scrapeDuckDuckGo(keyword: string): Promise<string[]> {
    const links: Set<string> = new Set();
    try {
      const searchQuery = encodeURIComponent(`site:t.me/joinchat OR site:t.me/+ "${keyword}"`);
      const url = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() }
      });
      const html = await response.text();
      this.extractLinksFromText(html).forEach(l => links.add(l));
    } catch (err) {
      console.error('[Scraper] DuckDuckGo Erro:', err);
    }
    return Array.from(links);
  }

  private async scrapeYandex(keyword: string): Promise<string[]> {
    const links: Set<string> = new Set();
    try {
      // Yandex Dork
      const searchQuery = encodeURIComponent(`site:t.me/joinchat "${keyword}"`);
      const url = `https://yandex.com/search/?text=${searchQuery}&lr=10552`;
      
      const response = await fetch(url, {
        headers: { 
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8'
        }
      });
      const html = await response.text();
      this.extractLinksFromText(html).forEach(l => links.add(l));
    } catch (err) {
      console.error('[Scraper] Yandex Erro:', err);
    }
    return Array.from(links);
  }

  /**
   * Extrai links de grupos do Telegram utilizando múltiplos motores de busca
   */
  async extractGroupsByKeyword(keyword: string): Promise<string[]> {
    console.log(`[Scraper] Iniciando varredura para o nicho: ${keyword}`);
    
    // Dispara as buscas em paralelo para maior velocidade
    const [ddgResults, yandexResults] = await Promise.all([
      this.scrapeDuckDuckGo(keyword),
      this.scrapeYandex(keyword)
    ]);

    const allLinks = new Set([...ddgResults, ...yandexResults]);
    console.log(`[Scraper] Varredura concluída. Encontrados ${allLinks.size} links únicos.`);
    
    return Array.from(allLinks);
  }
}

export const telegramScraper = new TelegramScraperService();
