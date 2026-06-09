const axios = require('axios');

async function testFakeUrl() {
  try {
    const res = await axios.get('https://chat.whatsapp.com/A1b2c3d4e5f6g7h8i9j0k1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const titleMatch = res.data.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : null;
    console.log('Title:', title);
  } catch (err) {
    console.log('Erro:', err.message);
  }
}
testFakeUrl();
