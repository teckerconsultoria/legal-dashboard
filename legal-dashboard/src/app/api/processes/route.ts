import { NextRequest, NextResponse } from 'next/server'
import { createEscavadorClient, ProcessItem } from '@/lib/escavador'
import { cacheGet, cacheSet } from '@/lib/cache'
import { apiRateLimiter } from '@/lib/rate-limit'

function buildResponse(processes: ProcessItem[], total: number) {
  let staleCount = 0
  let activeCount = 0
  let inactiveCount = 0

  processes.forEach(p => {
    if (p.daysSinceLastCheck > 30) staleCount++
    if (p.status === 'ATIVO') activeCount++
    if (p.status === 'INATIVO') inactiveCount++
  })

  const metrics = {
    total,
    stalePercent: processes.length > 0 ? Math.round((staleCount / processes.length) * 100) : 0,
    activeCount,
    inactiveCount,
    sampleProcessed: processes.length,
  }

  const histogram = [
    { range: '0-7 dias', count: processes.filter(p => p.daysSinceLastCheck <= 7).length },
    { range: '8-15 dias', count: processes.filter(p => p.daysSinceLastCheck > 7 && p.daysSinceLastCheck <= 15).length },
    { range: '16-30 dias', count: processes.filter(p => p.daysSinceLastCheck > 15 && p.daysSinceLastCheck <= 30).length },
    { range: '31-60 dias', count: processes.filter(p => p.daysSinceLastCheck > 30 && p.daysSinceLastCheck <= 60).length },
    { range: '60+ dias', count: processes.filter(p => p.daysSinceLastCheck > 60).length },
  ]

  const tribunalCounts: Record<string, number> = {}
  processes.forEach(p => {
    if (p.fonte_sigla) {
      tribunalCounts[p.fonte_sigla] = (tribunalCounts[p.fonte_sigla] || 0) + 1
    }
  })

  const distributionByTribunal = Object.entries(tribunalCounts)
    .map(([tribunal, count]) => ({
      tribunal,
      count,
      percent: Math.round((count / processes.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const hotCold = {
    quente: processes.filter(p => p.daysSinceLastCheck <= 7).length,
    morno: processes.filter(p => p.daysSinceLastCheck > 7 && p.daysSinceLastCheck <= 30).length,
    frio: processes.filter(p => p.daysSinceLastCheck > 30).length,
  }

  return { metrics, processes, histogram, distributionByTribunal, hotCold }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const oab_estado = searchParams.get('oab_estado')
  const oab_numero = searchParams.get('oab_numero')
  const limit = parseInt(searchParams.get('limit') || '100')

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

  const cacheKey = `escavador:processes:${oab_estado}:${oab_numero}:${limit}`
  const cached = cacheGet<ReturnType<typeof buildResponse>>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = createEscavadorClient(token)
    const { items, quantidade_processos } = await client.getProcesses(oab_estado, oab_numero, { limit })

    const response = buildResponse(items, quantidade_processos)
    cacheSet(cacheKey, response)
    return NextResponse.json(response)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
