"use client"
import { useState, useEffect } from 'react';

export default function TestDB() {
  const [log, setLog] = useState<string>('Loading...');

  useEffect(() => {
    async function test() {
      try {
        setLog('Buscando bots...');
        const res = await fetch('/api/bots');
        const bots = await res.json();
        
        if (!bots || bots.length === 0) {
          setLog('Nenhum bot encontrado no banco de dados.');
          return;
        }

        const botId = bots[0].id;
        setLog(`Bot encontrado: ${botId}. Testando atualização de aiSettings...`);

        const updateRes = await fetch('/api/bots', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: botId,
            aiSettings: { testKey: '123' },
            phone: '12345'
          })
        });

        const updateData = await updateRes.json();
        
        setLog(prev => prev + '\n\nUpdate Response:\n' + JSON.stringify(updateData, null, 2));

        if (!updateRes.ok) {
          setLog(prev => prev + '\n\nERRO NO UPDATE!');
          return;
        }

        setLog(prev => prev + '\n\nBuscando bot atualizado do Supabase de novo (não cacheado)...');
        
        // Agora vamos fazer uma chamada direta via uma rota nova ou usando a copy route!
        const fetchRes = await fetch('/api/bots');
        const updatedBots = await fetchRes.json();
        const updatedBot = updatedBots.find((b: any) => b.id === botId);

        setLog(prev => prev + '\n\nBot Atualizado recebido do banco:\n' + JSON.stringify(updatedBot, null, 2));
      } catch (err: any) {
        setLog(prev => prev + '\n\nCATCH ERROR:\n' + err.message);
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'black', backgroundColor: 'white' }}>
      <h1>Supabase DB Debugger</h1>
      <pre>{log}</pre>
    </div>
  );
}
