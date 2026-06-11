(async () => {
  const res = await fetch('https://flow.axoninteligencia.com.br/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: 'teste@teste.com', plan: 'pro' })
  });
  console.log(await res.text());
})();
