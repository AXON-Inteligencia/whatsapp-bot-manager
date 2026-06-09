const https = require('https');

https.get({
  hostname: 'html.duckduckgo.com',
  path: '/html/?q=site:chat.whatsapp.com+vendas',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const links = data.match(/chat\.whatsapp\.com\/[A-Za-z0-9_-]{20,25}/g);
    console.log('Links encontrados no DuckDuckGo:', links ? [...new Set(links)] : 'Nenhum');
  });
});
