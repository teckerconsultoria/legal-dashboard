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

  const cacheKey = `escavador:case:${numero}`
  const cached = cacheGet<object>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = createEscavadorClient(token)
    const [capa, movimentacoes, statusData] = await Promise.all([
      client.getCaseCNJ(numero),
      client.getMovimentacoes(numero),
      client.getStatusAtualizacao(numero),
    ])

    const response = { capa, movimentacoes, status: statusData }
    cacheSet(cacheKey, response, 120000) // 2 min — case details change more often
    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
