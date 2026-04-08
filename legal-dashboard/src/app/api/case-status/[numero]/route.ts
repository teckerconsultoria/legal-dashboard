import { NextRequest, NextResponse } from 'next/server'
import { createEscavadorClient } from '@/lib/escavador'
import { cacheGet, cacheSet } from '@/lib/cache'
import { apiRateLimiter } from '@/lib/rate-limit'

export async function GET(
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

  const cacheKey = `escavador:status:${numero}`
  const cached = cacheGet<object>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = createEscavadorClient(token)
    const data = await client.getStatusAtualizacao(numero)

    const lastCheck = data.data_ultima_verificacao
      ? new Date(data.data_ultima_verificacao)
      : null
    const days = lastCheck
      ? Math.floor((Date.now() - lastCheck.getTime()) / 86400000)
      : null

    const response = {
      ...data,
      tempo_desde_ultima_verificacao: days !== null ? `há ${days} dia${days !== 1 ? 's' : ''}` : null,
    }

    cacheSet(cacheKey, response, 60000) // 1 min — status changes frequently
    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
