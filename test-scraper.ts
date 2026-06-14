import { TelegramScraperService } from './lib/telegram/scraper';

async function test() {
  const scraper = new TelegramScraperService();
  const results = await scraper.extractGroupsByKeyword('vendas');
  console.log('Results:', results);
}

test();
