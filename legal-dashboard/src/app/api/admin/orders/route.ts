import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/utils/supabase/server'
import { ErrorCode } from '@/types/errors'

export async function GET(request: NextRequest) {
  // Auth check via cookie (SSR) ou Authorization: Bearer (testes de API)
  const authClient = await createClient()
  const { data: { user: cookieUser } } = await authClient.auth.getUser()

  let user = cookieUser

  if (!user) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const serviceClient = createServiceClient()
      const { data: { user: tokenUser } } = await serviceClient.auth.getUser(token)
      user = tokenUser
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Busca orders com SKU name
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      customer_email,
      target_oab_estado,
      target_oab_numero,
      target_numero_cnj,
      assigned_operator_id,
      total_cents,
      created_at,
      updated_at,
      order_items (
        sku_catalog ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Busca fulfillment_queue para todos os pedidos
  const orderIds = (orders ?? []).map(o => o.id)
  const { data: queueRows } = orderIds.length
    ? await supabase
        .from('fulfillment_queue')
        .select('order_id, status, attempt_count, last_error, next_retry_at')
        .in('order_id', orderIds)
    : { data: [] }

  const queueByOrderId = new Map(
    (queueRows ?? []).map(q => [q.order_id, q])
  )

  type OrderItem = { sku_catalog: { name: string } | null }
  const result = (orders ?? []).map(order => {
    const queue = queueByOrderId.get(order.id)
    const skuName = (order.order_items as unknown as OrderItem[])?.[0]?.sku_catalog?.name ?? null
    return {
      id: order.id,
      status: order.status,
      customer_email: order.customer_email,
      target_oab_estado: order.target_oab_estado,
      target_oab_numero: order.target_oab_numero,
      target_numero_cnj: order.target_numero_cnj,
      assigned_operator_id: order.assigned_operator_id,
      total_cents: order.total_cents,
      sku_name: skuName,
      created_at: order.created_at,
      updated_at: order.updated_at,
      queue_status: queue?.status ?? null,
      attempt_count: queue?.attempt_count ?? 0,
      last_error: queue?.last_error ?? null,
      next_retry_at: queue?.next_retry_at ?? null,
    }
  })

  return NextResponse.json({ orders: result })
}
