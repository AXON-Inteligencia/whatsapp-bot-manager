import express from 'express';
import cors from 'cors';
import { WhatsAppService } from '../lib/whatsapp/service';
import { redisRest } from '../lib/redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOTOR_PORT || process.env.PORT || 10001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', motor: true });
});

app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    const { botId } = req.body;
    if (!botId) return res.status(400).json({ error: 'botId é obrigatório' });

    console.log(`[Motor] Iniciando conexão para o bot: ${botId}`);

    const currentStatus = await redisRest.get(`status:${botId}`);
    if (currentStatus === 'connected' || currentStatus === 'online') {
      return res.json({ message: 'Bot já está conectado', status: 'online', botId });
    }

    await redisRest.set(`status:${botId}`, 'connecting', { ex: 120 });

    WhatsAppService.connect(botId).catch((error) => {
      console.error(`Erro ao conectar bot ${botId}:`, error);
      redisRest.set(`status:${botId}`, 'offline').catch(() => {});
    });

    const startTime = Date.now();
    let qr: string | null = null;

    while (Date.now() - startTime < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const stored = await redisRest.get(`qr:${botId}`);
      if (stored) {
        qr = stored as string;
        break;
      }
      const status = await redisRest.get(`status:${botId}`);
      if (status === 'connected' || status === 'online') {
        return res.json({ message: 'Bot conectado com sessão existente', status: 'online', botId });
      }
    }

    if (qr) return res.json({ message: 'QR Code gerado com sucesso', status: 'connecting', botId, qr });

    return res.json({ message: 'Conexão iniciada. Use o endpoint de QR.', status: 'connecting', botId, qr: null });
  } catch (error: any) {
    console.error('Erro ao iniciar conexão:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { botId } = req.body;
    if (!botId) return res.status(400).json({ error: 'botId é obrigatório' });

    console.log(`[Motor] Desconectando bot: ${botId}`);
    await WhatsAppService.logout(botId);
    return res.json({ success: true, message: 'Bot desconectado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desconectar bot:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { botId, to, message, mediaUrl, mediaType } = req.body;
    if (!botId || !to || !message) return res.status(400).json({ error: 'botId, to, e message são obrigatórios' });

    const formattedTo = to.includes('@s.whatsapp.net') || to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;

    if (mediaUrl && mediaType) {
      await WhatsAppService.sendMessageWithMedia(botId, formattedTo, message, mediaUrl, mediaType);
    } else {
      await WhatsAppService.sendMessage(botId, formattedTo, message);
    }

    return res.json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao enviar mensagem via Motor:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Motor] Servidor rodando na porta ${PORT}`);
});
