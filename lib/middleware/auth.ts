import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function verifyAuth(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return {
        isValid: false,
        error: 'Token não fornecido',
        status: 401,
      };
    }

    const verified = await jwtVerify(token, secret);
    return {
      isValid: true,
      payload: verified.payload,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Token inválido ou expirado',
      status: 401,
    };
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Validar se o botId pertence ao usuário autenticado
 */
export async function validateBotOwnership(
  req: NextRequest,
  botId: string
): Promise<{ isValid: boolean; error?: string }> {
  // TODO: Implementar validação de propriedade do bot
  // Por enquanto, apenas verificar se o botId é válido
  if (!botId || botId.length === 0) {
    return { isValid: false, error: 'botId inválido' };
  }

  return { isValid: true };
}

/**
 * Rate limiting simples baseado em IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000
): { isAllowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { isAllowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { isAllowed: false, remaining: 0 };
  }

  record.count++;
  return { isAllowed: true, remaining: limit - record.count };
}

/**
 * Sanitizar entrada de usuário
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000); // Limitar tamanho
}

/**
 * Validar formato de telefone
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[0-9]{10,15}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  return phoneRegex.test(cleanPhone);
}

/**
 * Validar URL
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
