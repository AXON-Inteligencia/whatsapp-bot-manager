import { NextRequest, NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Não autenticado') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Não autorizado') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Recurso não encontrado') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Conflito') {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Muitas requisições') {
    super(429, message, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Erro interno do servidor') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

/**
 * Tratador de erro centralizado
 */
export function handleError(error: unknown): NextResponse {
  console.error('Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || 'Erro desconhecido',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrapper para rotas com tratamento de erro automático
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Validador de schema com Zod (opcional)
 */
export async function validateRequest<T>(
  req: NextRequest,
  schema: any
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: string }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return { error: errors };
    }

    return { data: result.data };
  } catch (error) {
    return { error: 'Corpo da requisição inválido' };
  }
}
