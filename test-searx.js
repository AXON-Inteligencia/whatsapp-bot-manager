const fetch = require('node-fetch');

async function testSearx() {
  const instances = [
    'https://searx.be',
    'https://searx.tiekoetter.com',
    'https://searx.work',
    'https://paulgo.io'
  ];
  
  for (const url of instances) {
    try {
      const res = await fetch(`${url}/search?q=site:t.me/joinchat+vendas&format=json`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success on ${url}: Found ${data.results?.length} results`);
        if (data.results?.length > 0) {
          console.log(data.results[0].url);
        }
      } else {
        console.log(`Failed on ${url}: ${res.status}`);
      }
    } catch (err) {
      console.log(`Error on ${url}: ${err.message}`);
    }
  }
}

testSearx();
