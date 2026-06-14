import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram/mtproto';

// Temporary botId for testing userbot features (can be linked to auth token later)
const TEMP_BOT_ID = 'telegram-userbot-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phoneNumber, code, password } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'Número de telefone é obrigatório' }, { status: 400 });
    }

    // Formatação inteligente do número
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove tudo que não é número
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = '+55' + formattedPhone; // Adiciona +55 automaticamente
    } else if (!phoneNumber.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    } else {
      formattedPhone = phoneNumber;
    }

    if (action === 'sendCode') {
      const result = await telegramService.sendLoginCode(TEMP_BOT_ID, formattedPhone);
      return NextResponse.json(result);
    } 
    
    if (action === 'verifyCode') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Código SMS é obrigatório' }, { status: 400 });
      }
      const result = await telegramService.verifyLoginCode(TEMP_BOT_ID, code, password);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });

  } catch (error: any) {
    console.error('[Telegram API Auth Error]', error);
    
    // Check if error is two-factor auth required
    if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
      return NextResponse.json({ success: false, error: 'Autenticação de 2 Fatores necessária (Senha de Nuvem)' }, { status: 401 });
    }
    
    return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
