import { NextRequest, NextResponse } from 'next/server'
import { createEscavadorClient, isEconomicInviability, shouldRequestUpdate } from '@/lib/escavador'
import { apiRateLimiter } from '@/lib/rate-limit'
import { saveUpdateRequest, getPendingUpdates } from '@/lib/cache'

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
    const { 
      enviar_callback = true, 
      documentos_publicos = false, 
      autos = false,
      force = false,
      daysSinceLastCheck,
    } = body

    // Verificar Economic Inviability (EI) se não for forçado
    if (!force && !shouldRequestUpdate(daysSinceLastCheck ?? null)) {
      if (isEconomicInviability(daysSinceLastCheck ?? null)) {
        return NextResponse.json({ 
          error: 'Economic Inviability - processo com staleness muito alto',
          ei: true,
          threshold_days: Number(process.env.STALENESS_EI_THRESHOLD) || 730,
        }, { status: 422 })
      }
      return NextResponse.json({ 
        error: 'Processo não requer atualização',
        stale: false,
      }, { status: 200 })
    }

    // Verificar se já existe requisição pendente
    const pending = getPendingUpdates().filter(u => u.numero_cnj === numero)
    if (pending.length > 0 && !force) {
      return NextResponse.json({ 
        error: 'Update já pendente',
        pending: pending.length,
        request_id: pending[0].request_id,
      }, { status: 409 })
    }

    const client = createEscavadorClient(token)
    const result = await client.requestUpdate(numero, {
      enviar_callback: !!enviar_callback,
      documentos_publicos: !!documentos_publicos,
      autos: !!autos,
    })

    // Armazenar request_id para tracking
    saveUpdateRequest({
      request_id: result.id,
      numero_cnj: numero,
      status: 'pending',
      solicitado_em: result.solicitado_em,
      callback_url: process.env.ESCAVADOR_CALLBACK_URL,
    })

    return NextResponse.json({
      ...result,
      tracked: true,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
