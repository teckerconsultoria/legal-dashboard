import { NextRequest, NextResponse } from 'next/server'
import { createEscavadorClient } from '@/lib/escavador'
import { apiRateLimiter } from '@/lib/rate-limit'
import { cacheGet as _cacheGet, cacheSet as _cacheSet } from '@/lib/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Escavador API not configured' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!apiRateLimiter.check(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { enviar_callback, documentos_publicos, autos } = body

    const client = createEscavadorClient(token)
    const result = await client.requestUpdate(numero, {
      enviar_callback: !!enviar_callback,
      documentos_publicos: !!documentos_publicos,
      autos: !!autos,
    })

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
