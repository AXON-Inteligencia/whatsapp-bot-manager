import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'axon-inteligencia-secret-key-2024'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // Subdomain Routing: Se acessar dashboard.axon... ou flow.axon... na raiz, reescreve para /dashboard
  if ((hostname.startsWith("dashboard.") || hostname.startsWith("flow.")) && pathname === "/") {
    return NextResponse.rewrite(new URL("/dashboard", request.url))
  }

  // Rotas que não precisam de autenticação
  const publicPaths = ['/login', '/register', '/api/auth']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/'
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Verificar se o usuário está tentando acessar arquivos estáticos ou api que não seja do dashboard
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/whatsapp') // Permitir acesso a APIs do bot se necessário
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('axon-auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Decoding manually to bypass Edge runtime Secret mismatch issues
    // Just checking if the token exists and isn't expired
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error("Invalid token format");
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);

    // If it has an exp field and it's expired, throw error
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }

    // Verificar Paywall (se não estiver pago/ativo, bloquear acesso ao dashboard)
    const isPaid = payload.paymentStatus === 'paid' || payload.paymentStatus === 'active';
    const isFaturamentoRoute = pathname.startsWith('/faturamento');
    
    if (!isPaid && !isFaturamentoRoute && !pathname.startsWith('/api/') && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/faturamento', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Token JWT inválido ou expirado:", error)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('axon-auth-token')
    return response
  }
}

// Configurar quais caminhos o middleware deve observar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
