const https = require('https');

function checkLink(code) {
  https.get(`https://chat.whatsapp.com/${code}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const titleMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
      console.log(`Code: ${code} - Title:`, titleMatch ? titleMatch[1] : 'No title');
    });
  });
}

// Test with a known invalid/random code
checkLink('K1j2h3g4f5e6d7c8b9a0z9');
