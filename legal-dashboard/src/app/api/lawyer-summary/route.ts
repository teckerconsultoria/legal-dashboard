import { NextRequest, NextResponse } from 'next/server'
import { createEscavadorClient } from '@/lib/escavador'
import { cacheGet, cacheSet } from '@/lib/cache'
import { apiRateLimiter } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const oab_estado = searchParams.get('oab_estado')
  const oab_numero = searchParams.get('oab_numero')
  const oab_tipo = searchParams.get('oab_tipo') ?? undefined

  if (!oab_estado || !oab_numero) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Escavador API not configured' }, { status: 503 })
  }

  const identifier = `oab:${oab_estado}:${oab_numero}`
  if (!apiRateLimiter.check(identifier)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const cacheKey = `escavador:lawyer:${oab_estado}:${oab_numero}`
  const cached = cacheGet<object>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = createEscavadorClient(token)
    const data = await client.getLawyerSummary(oab_estado, oab_numero, oab_tipo)

    const response = { ...data, oab_estado }
    cacheSet(cacheKey, response)
    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
