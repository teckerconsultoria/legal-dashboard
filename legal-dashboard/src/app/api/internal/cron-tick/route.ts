import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { processOrderAsync } from '@/lib/fulfillment-engine'
import { sendOperatorAlert } from '@/lib/mailer'
import { ErrorCode } from '@/types/errors'

const MAX_ATTEMPTS = 3
const STUCK_THRESHOLD_MINUTES = 20
const BATCH_SIZE = 5

export async function POST(request: NextRequest) {
  // Proteção da rota interna
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // ── Detectar stuck orders (processing > 20min) ──────────────────────────
  const stuckThreshold = new Date(now.getTime() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()
  const { data: stuckOrders } = await supabase
    .from('fulfillment_queue')
    .select('id, order_id')
    .eq('status', 'processing')
    .lt('scheduled_at', stuckThreshold)

  if (stuckOrders?.length) {
    // Marcar como dead e alertar operador
    const stuckIds = stuckOrders.map(r => r.id)
    await supabase
      .from('fulfillment_queue')
      .update({
        status: 'dead',
        last_error: { error: `Stuck for >${STUCK_THRESHOLD_MINUTES}min`, code: ErrorCode.STEP_TIMEOUT },
      })
      .in('id', stuckIds)

    const operatorEmail = process.env.OPERATOR_EMAIL
    if (operatorEmail) {
      sendOperatorAlert({
        to: operatorEmail,
        subject: `[Legal Dashboard] ${stuckOrders.length} pedido(s) travado(s)`,
        body: `Os seguintes pedidos foram marcados como dead por timeout:\n\n${stuckOrders.map(r => `- order_id: ${r.order_id}`).join('\n')}`,
      }).catch(err => console.error('[cron-tick] alert error:', err))
    }
  }

  // ── Buscar até 5 pedidos pending ─────────────────────────────────────────
  const { data: pendingRows } = await supabase
    .from('fulfillment_queue')
    .select('id, order_id, attempt_count')
    .eq('status', 'pending')
    .lte('next_retry_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (!pendingRows?.length) {
    return NextResponse.json({
      processed: 0,
      stuck_marked_dead: stuckOrders?.length ?? 0,
    })
  }

  // ── Processar cada pedido ────────────────────────────────────────────────
  const results = await Promise.allSettled(
    pendingRows.map(async row => {
      // Claim: marcar como processing
      const { data: claimed } = await supabase
        .from('fulfillment_queue')
        .update({ status: 'processing', scheduled_at: now.toISOString() })
        .eq('id', row.id)
        .eq('status', 'pending')
        .select('id')

      if (!claimed?.length) return { orderId: row.order_id, skipped: true }

      try {
        const result = await processOrderAsync(row.order_id)

        await supabase
          .from('fulfillment_queue')
          .update({ status: 'done' })
          .eq('id', row.id)

        return { orderId: row.order_id, ...result }
      } catch (err) {
        const nextAttempt = row.attempt_count + 1
        // SCHEMA_INVALID nunca vai mudar — morte imediata sem retry
        const isSchemaError = (err as { code?: string })?.code === ErrorCode.SCHEMA_INVALID
        const isDead = isSchemaError || nextAttempt >= MAX_ATTEMPTS

        // Backoff simples: 2^attempt minutos
        const nextRetryMs = isDead ? 0 : Math.pow(2, nextAttempt) * 60 * 1000
        const nextRetryAt = new Date(now.getTime() + nextRetryMs).toISOString()

        await supabase
          .from('fulfillment_queue')
          .update({
            status: isDead ? 'dead' : 'pending',
            attempt_count: nextAttempt,
            next_retry_at: nextRetryAt,
            last_error: {
              error: err instanceof Error ? err.message : 'Unknown error',
              code: ErrorCode.STEP_FAILED,
            },
          })
          .eq('id', row.id)

        if (isDead) {
          const operatorEmail = process.env.OPERATOR_EMAIL
          if (operatorEmail) {
            sendOperatorAlert({
              to: operatorEmail,
              subject: `[Legal Dashboard] Pedido ${row.order_id.slice(-8)} falhou após ${MAX_ATTEMPTS} tentativas`,
              body: `order_id: ${row.order_id}\nErro: ${err instanceof Error ? err.message : 'Unknown'}`,
            }).catch(e => console.error('[cron-tick] alert error:', e))
          }
        }

        throw err
      }
    })
  )

  const processed = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    processed,
    failed,
    stuck_marked_dead: stuckOrders?.length ?? 0,
    total: pendingRows.length,
  })
}
