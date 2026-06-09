const axios = require('axios');

async function scrapeDDG() {
  try {
    const res = await axios.post('https://lite.duckduckgo.com/lite/', 'q=' + encodeURIComponent('site:chat.whatsapp.com vendas'), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const links = res.data.match(/chat\.whatsapp\.com\/[A-Za-z0-9_-]{20,25}/g);
    console.log('Links DDG Lite:', links ? [...new Set(links)] : 'Nenhum');
  } catch (err) {
    console.error('Erro DDG:', err.message);
  }
}
scrapeDDG();
