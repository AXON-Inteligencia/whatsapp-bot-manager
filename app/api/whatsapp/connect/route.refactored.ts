import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp/service';
import { redisRest } from '@/lib/redis';
import {
  withErrorHandler,
  ValidationError,
  InternalServerError,
  checkRateLimit,
} from '@/lib/middleware/error-handler';
import { validateBotOwnership } from '@/lib/middleware/auth';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { isAllowed, remaining } = checkRateLimit(ip, 50, 60000);

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Validar request
  const body = await req.json();
  const { botId } = body;

  if (!botId) {
    throw new ValidationError('botId é obrigatório');
  }

  // Validar propriedade do bot
  const { isValid, error } = await validateBotOwnership(req, botId);
  if (!isValid) {
    throw new ValidationError(error || 'Bot inválido');
  }

  // Verificar se o bot já está conectado
  const currentStatus = await WhatsAppService.getStatus(botId);
  if (currentStatus === 'online') {
    return NextResponse.json(
      {
        message: 'Bot já está conectado',
        status: 'online',
      },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  }

  // Marcar como conectando
  await redisRest.set(`status:${botId}`, 'connecting');

  // Iniciar conexão em background
  WhatsAppService.connect(
    botId,
    async (qr) => {
      await redisRest.set(`qr:${botId}`, qr, { ex: 90 });
      console.log(`QR Code gerado para bot ${botId}`);
    },
    async () => {
      await redisRest.del(`qr:${botId}`);
      await redisRest.set(`status:${botId}`, 'online');
      console.log(`Bot ${botId} conectado com sucesso`);
    }
  ).catch((error) => {
    console.error(`Erro ao conectar bot ${botId}:`, error);
    redisRest.set(`status:${botId}`, 'offline');
  });

  return NextResponse.json(
    {
      message: 'Conexão iniciada, aguarde o QR Code',
      status: 'connecting',
      botId,
    },
    { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
  );
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    throw new ValidationError('botId é obrigatório');
  }

  // Validar propriedade do bot
  const { isValid, error } = await validateBotOwnership(req, botId);
  if (!isValid) {
    throw new ValidationError(error || 'Bot inválido');
  }

  const status = await WhatsAppService.getStatus(botId);
  const qr = await redisRest.get(`qr:${botId}`);
  const connectedAt = await redisRest.get(`connected_at:${botId}`);

  return NextResponse.json({
    botId,
    status,
    qr: qr || null,
    connectedAt: connectedAt || null,
  });
});
