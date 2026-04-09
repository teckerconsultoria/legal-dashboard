import { NextRequest, NextResponse } from 'next/server'
import { saveUpdateRequest, getUpdateRequest, UpdateRequest } from '@/lib/cache'

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processCompletedUpdate(requestId: string, resultado: unknown) {
  console.log(`[webhook] Processing completed update for ${requestId}`, resultado)
  // TODO: Atualizar cache do processo com novos dados
  // Este é o passo que integra o resultado ao cache do processo
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { request_id, status, numero_processo, resultado, error } = body

    if (!request_id) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 })
    }

    // Buscar request original
    const existing = getUpdateRequest(request_id)
    if (!existing) {
      // Request não encontrado no nosso cache — pode ser callback de outra origem
      // Nonetheless, processamos para idempotência
      console.warn(`[webhook] Unknown request_id: ${request_id}`)
    }

    // Atualizar status
    const newStatus: UpdateRequest['status'] = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending'
    const updated: UpdateRequest = {
      ...(existing ?? {
        request_id,
        numero_cnj: numero_processo,
        solicitado_em: new Date().toISOString(),
      }),
      status: newStatus,
      concluido_em: new Date().toISOString(),
      error: error?.message,
    }

    saveUpdateRequest(updated)

    // Se completado com resultado, processar
    if (status === 'completed' && resultado) {
      try {
        await processCompletedUpdate(request_id, resultado)
      } catch (procError) {
        console.error(`[webhook] Error processing result for ${request_id}:`, procError)
        // Não falhar o webhook - o resultado fica pendente para retry manual
      }
    }

    // Se falhou, implementar retry logic (T4)
    if (status === 'failed' && error) {
      console.warn(`[webhook] Update failed for ${request_id}:`, error.message)
      // TODO: Implementar retry via cron job
      // Por ora, marca como failed para investigação manual
    }

    return NextResponse.json({ success: true, request_id, status: updated.status })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}