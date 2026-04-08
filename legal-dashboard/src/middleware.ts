import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/skus', '/api/checkout', '/_next', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('sb-access-token')

  if (!authCookie && pathname.startsWith('/api')) {
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