const axios = require('axios');

async function validateGroup(code) {
  try {
    const res = await axios.get(`https://chat.whatsapp.com/${code}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const titleMatch = res.data.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : null;
    
    // "WhatsApp Group Invite" usually means the group link is revoked or invalid
    if (title && title !== 'WhatsApp Group Invite') {
      return { valid: true, name: title };
    }
    return { valid: false };
  } catch (err) {
    return { valid: false };
  }
}

async function test() {
  const alive = await validateGroup('ENfJov745oX5wR00a8tG2z'); // some random code
  console.log('Result:', alive);
}
test();
