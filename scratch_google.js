const axios = require('axios');

async function scrapeGoogle() {
  try {
    const res = await axios.get('https://www.google.com/search?q=site:chat.whatsapp.com+vendas', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    console.log('Tamanho da resposta:', res.data.length);
    console.log('Trecho:', res.data.substring(0, 500));
    const urls = res.data.match(/http/g);
    console.log('Qtd http:', urls ? urls.length : 0);
  } catch (err) {
    console.error('Erro Google:', err.message);
  }
}
scrapeGoogle();
