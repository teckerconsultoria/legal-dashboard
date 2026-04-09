/**
 * Helpers de API para setup/teardown nos testes E2E.
 * Usa Supabase service role key e endpoints internos para preparar estado.
 */

import type { APIRequestContext } from '@playwright/test'
import type { Pilot } from './pilots'
import { CRON_SECRET } from './pilots'

const SUPABASE_URL = 'https://ytyznzelkdorlctzysve.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2NjU2NywiZXhwIjoyMDkxMjQyNTY3fQ.QvUE5dZOxDDo3cUlHS4Na7HQ4QvSF-oEV4RJ2nSCRVY'

const SB_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

/** Busca o ID de uma SKU pelo nome */
export async function getSkuId(request: APIRequestContext, skuName: string): Promise<string> {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/sku_catalog?name=eq.${encodeURIComponent(skuName)}&select=id`,
    { headers: SB_HEADERS }
  )
  const rows = await res.json()
  if (!rows.length) throw new Error(`SKU não encontrada: ${skuName}`)
  return rows[0].id
}

/**
 * Cria um pedido diretamente no Supabase já em status 'paid'
 * com os campos de OAB do piloto preenchidos.
 * Isso simula o fluxo completo Stripe → webhook sem usar o Stripe real.
 */
export async function createPaidOrder(
  request: APIRequestContext,
  skuId: string,
  pilot: Pilot
): Promise<string> {
  // Cria order
  const orderRes = await request.post(`${SUPABASE_URL}/rest/v1/orders`, {
    headers: SB_HEADERS,
    data: {
      status: 'paid',
      customer_email: pilot.email,
      total_cents: 0,
      target_oab_estado: pilot.oab_estado,
      target_oab_numero: pilot.oab_numero,
    },
  })
  const [order] = await orderRes.json()
  const orderId: string = order.id

  // Cria order_item
  await request.post(`${SUPABASE_URL}/rest/v1/order_items`, {
    headers: SB_HEADERS,
    data: {
      order_id: orderId,
      sku_id: skuId,
      quantity: 1,
      unit_price_cents: 0,
      subtotal_cents: 0,
    },
  })

  return orderId
}

/** Dispara o cron-tick e retorna o JSON de resposta */
export async function triggerCronTick(request: APIRequestContext): Promise<{
  processed: number
  failed: number
  stuck_marked_dead: number
}> {
  const res = await request.post('http://localhost:3000/api/internal/cron-tick', {
    headers: { 'x-cron-secret': CRON_SECRET },
  })
  return res.json()
}

/** Busca os steps de fulfillment de um pedido via API admin */
export async function getOrderSteps(
  request: APIRequestContext,
  orderId: string,
  authToken: string
): Promise<Array<{ step_id: string; layer: number; status: string; error: unknown }>> {
  const res = await request.get(`http://localhost:3000/api/admin/orders/${orderId}/steps`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const data = await res.json()
  return data.steps ?? []
}

/** Busca o status de um pedido no Supabase */
export async function getOrderStatus(
  request: APIRequestContext,
  orderId: string
): Promise<string> {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=status`,
    { headers: SB_HEADERS }
  )
  const [row] = await res.json()
  return row?.status ?? 'unknown'
}

/** Limpa pedidos de teste (pelo email do piloto) */
export async function cleanupPilotOrders(
  request: APIRequestContext,
  pilotEmail: string
): Promise<void> {
  await request.delete(
    `${SUPABASE_URL}/rest/v1/orders?customer_email=eq.${encodeURIComponent(pilotEmail)}&total_cents=eq.0`,
    { headers: SB_HEADERS }
  )
}

/** Obtém token de sessão do operador via Supabase Auth */
export async function getOperatorToken(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Login do operador falhou')
  return data.access_token
}
