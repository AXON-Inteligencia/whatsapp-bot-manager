import { downloadMediaMessage, WAMessage } from '@whiskeysockets/baileys';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function downloadAudio(msg: WAMessage): Promise<Buffer> {
  try {
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      { 
        logger: console as any,
        reuploadRequest: () => new Promise((resolve) => resolve(msg)) 
      }
    );
    return buffer as Buffer;
  } catch (error) {
    throw new Error('Falha ao fazer download do áudio da mensagem');
  }
}

export async function transcribeAudio(buffer: Buffer, apiKey: string): Promise<string | null> {
  const tmpFilePath = path.join(os.tmpdir(), `audio-${Date.now()}-${Math.floor(Math.random() * 1000)}.ogg`);
  
  try {
    // A abordagem mais segura para SDKs estilo OpenAI no Node é usar um ReadStream real
    fs.writeFileSync(tmpFilePath, buffer);
    
    const groq = new Groq({ apiKey });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpFilePath),
      model: 'whisper-large-v3',
      language: 'pt',
      response_format: 'text',
    }, { signal: controller.signal as any });

    clearTimeout(timeoutId);

    // Dependendo da versão da SDK, response_format: 'text' pode retornar uma string direta ou um objeto {text}
    const result = typeof transcription === 'string' ? transcription : (transcription as any).text;

    if (!result || result.trim().length === 0) {
      return null;
    }

    return result.trim();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[Áudio] Timeout na transcrição (8s excedidos)');
    } else {
      console.error('[Áudio] Erro na transcrição:', error);
    }
    return null;
  } finally {
    // Sempre limpa o arquivo temporário
    if (fs.existsSync(tmpFilePath)) {
      try {
        fs.unlinkSync(tmpFilePath);
      } catch (e) {
        console.error('Erro ao deletar arquivo temporário de áudio:', e);
      }
    }
  }
}
