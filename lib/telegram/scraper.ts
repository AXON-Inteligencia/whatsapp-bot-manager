export class TelegramScraperService {
  private extractLinksFromText(text: string): string[] {
    const links: string[] = [];
    // Busca padrões t.me/joinchat/XXXXX ou t.me/+XXXXX
    const regex = /(?:https?:\/\/)?(?:www\.)?t\.me\/(?:joinchat\/|\+)[a-zA-Z0-9_-]+/g;
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(link => {
        links.push(link.replace('http://', 'https://'));
      });
    }
    return links;
  }

  // Novo Motor Pesado: SerpApi (Buscando no Google com IPs residenciais indetectáveis)
  private async scrapeSerpApi(keyword: string): Promise<string[]> {
    const links: Set<string> = new Set();
    const API_KEY = process.env.SERPAPI_KEY || '37b0bbddeebe4ad8dbf931674254dd5a487dcf321640da5b245ed6ed362ed630';
    
    try {
      // Dork avançado no Google
      const query = encodeURIComponent(`site:t.me/joinchat OR site:t.me/+ "${keyword}"`);
      const url = `https://serpapi.com/search.json?engine=google&q=${query}&num=20&api_key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.organic_results) {
        data.organic_results.forEach((result: any) => {
          // Extrai o link direto
          if (result.link && (result.link.includes('t.me/joinchat') || result.link.includes('t.me/+'))) {
            links.add(result.link.replace('http://', 'https://'));
          }
          // Extrai links escondidos na descrição (snippet)
          if (result.snippet) {
             this.extractLinksFromText(result.snippet).forEach(l => links.add(l));
          }
        });
      }
    } catch (err) {
      console.error('[Scraper] SerpApi Erro:', err);
    }
    return Array.from(links);
  }

  /**
   * Extrai links utilizando o Motor SerpApi Profissional
   */
  async extractGroupsByKeyword(keyword: string): Promise<string[]> {
    console.log(`[Scraper] Iniciando varredura com SerpApi para: ${keyword}`);
    
    const results = await this.scrapeSerpApi(keyword);
    const allLinks = new Set([...results]);
    
    console.log(`[Scraper] Varredura concluída. Encontrados ${allLinks.size} links reais.`);
    
    return Array.from(allLinks);
  }
}

export const telegramScraper = new TelegramScraperService();
