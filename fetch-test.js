fetch('https://flow.axoninteligencia.com.br/').then(r => r.text()).then(t => { const match = t.match(/"buildId":"(.*?)"/); console.log(match ? match[1] : 'No build id'); }).catch(console.error);
