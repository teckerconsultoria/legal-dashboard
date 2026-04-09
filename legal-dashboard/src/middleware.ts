import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/skus',
  '/api/checkout',
  '/api/internal',  // cron-tick usa x-cron-secret próprio
  '/api/webhooks',  // Stripe webhook usa assinatura própria
  '/_next',
  '/favicon.ico',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Aceita cookie Supabase SSR (sb-{ref}-auth-token) ou sb-access-token legado
  const authCookie = request.cookies.getAll().find(c =>
    c.name === 'sb-access-token' ||
    (c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  )
  // Aceita também Authorization: Bearer (útil para testes de API)
  const authHeader = request.headers.get('authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ') ?? false

  if (!authCookie && !hasBearerToken && pathname.startsWith('/api')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)'
}