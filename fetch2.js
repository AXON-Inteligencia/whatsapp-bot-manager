const fs = require('fs');
fetch('https://flow.axoninteligencia.com.br/').then(r => r.text()).then(t => {
  fs.writeFileSync('output.html', t);
}).catch(console.error);
