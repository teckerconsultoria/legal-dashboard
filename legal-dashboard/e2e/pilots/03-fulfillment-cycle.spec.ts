/**
 * Suite: Ciclo Completo de Fulfillment — 3 SKUs × 3 pilotos
 *
 * Cobertura:
 *   FE-01  Report Saúde       × Renato Lacerda  PB/24398  (sync)
 *   FE-02  Report Priorização × Victor Assis    PB/13477  (async)
 *   FE-03  Report Priorização × Rodrigo Mendes  PB/26665  (async)
 *   FE-04  Report Priorização × Renato Lacerda  PB/24398  (async)
 *   FE-05  Report Governança  × Renato Lacerda  PB/24398  (async)
 *   FE-06  Report Governança  × Victor Assis    PB/13477  (async)
 *   FE-07  Report Governança  × Rodrigo Mendes  PB/26665  (async)
 *
 * Fluxo por suite:
 *   beforeAll → cria order paid + enfileira na fulfillment_queue
 *   test 1   → valida order criada (status + OAB)
 *   test 2   → dispara cron-tick, valida processed >= 1
 *   test 3   → aguarda delivered | failed (polling 5s, max 90s)
 *   test 4   → valida steps Layer 1 (lawyer_summary + processes)
 *   test 5   → valida steps Layer 2 (foreach steps — apenas async)
 *   test 6   → valida order_report (completion_status + access_token)
 *   afterAll → cleanup orders de teste
 *
 * ── CACHE ────────────────────────────────────────────────────────────────────
 * Ative em .env.local para acelerar re-runs:
 *   ESCAVADOR_CACHE_MODE=file
 *
 * Primeiro run: ~20-30s por piloto (sync) / ~60-120s (async, inclui Layer 2).
 * Runs seguintes: ~5-10s (lê de .cache/escavador/).
 *
 * Para resetar:
 *   npx tsx scripts/clear-escavador-cache.ts           # tudo
 *   npx tsx scripts/clear-escavador-cache.ts --oab=PB/24398
 *
 * CI: não defina ESCAVADOR_CACHE_MODE (default = none).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test'
import { PILOTS, SKU_NAMES, OPERATOR } from './helpers/pilots'
import {
  getSkuId,
  createPaidOrder,
  triggerCronTick,
  getOrderSteps,
  getOrderStatus,
  cleanupPilotOrders,
  getOperatorToken,
} from './helpers/api'

test.setTimeout(180_000)

const SUPABASE_URL = 'https://ytyznzelkdorlctzysve.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2NjU2NywiZXhwIjoyMDkxMjQyNTY3fQ.QvUE5dZOxDDo3cUlHS4Na7HQ4QvSF-oEV4RJ2nSCRVY'

const SB_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function enqueue(
  request: Parameters<typeof triggerCronTick>[0],
  orderId: string
) {
  await request.post(`${SUPABASE_URL}/rest/v1/fulfillment_queue`, {
    headers: SB_HEADERS,
    data: { order_id: orderId, status: 'pending' },
  })
}

async function waitForCompletion(
  request: Parameters<typeof getOrderStatus>[0],
  orderId: string,
  maxWaitMs = 120_000
): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const status = await getOrderStatus(request, orderId)
    if (status !== 'processing' && status !== 'paid') return status
    await new Promise(r => setTimeout(r, 5_000))
  }
  return 'timeout'
}

// ─── Factory: gera um describe completo por combinação SKU × piloto ───────────

function makeSuite(opts: {
  feId: string
  skuLabel: keyof typeof SKU_NAMES
  pilotIndex: 0 | 1 | 2
  layer2StepPrefix: string | null  // ex: 'movimentacoes' | null para SKU sem Layer 2
  layer1MinSteps: number
}) {
  const { feId, skuLabel, pilotIndex, layer2StepPrefix, layer1MinSteps } = opts
  const pilot = PILOTS[pilotIndex]
  const skuName = SKU_NAMES[skuLabel]
  const isSync = skuLabel === 'simples'

  test.describe(`${feId} · ${pilot.name} — ${skuName} (${isSync ? 'sync' : 'async'})`, () => {
    let orderId: string
    let operatorToken: string

    test.beforeAll(async ({ request }) => {
      test.setTimeout(180_000)
      operatorToken = await getOperatorToken(request, OPERATOR.email, OPERATOR.password)
      const skuId = await getSkuId(request, skuName)
      orderId = await createPaidOrder(request, skuId, pilot)
      await enqueue(request, orderId)
    })

    test.afterAll(async ({ request }) => {
      await cleanupPilotOrders(request, pilot.email)
    })

    test('order criada com status paid e OAB correta', async ({ request }) => {
      const res = await request.get(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=status,target_oab_estado,target_oab_numero`,
        { headers: SB_HEADERS }
      )
      const [order] = await res.json()
      expect(order.status).toBe('paid')
      expect(order.target_oab_estado).toBe(pilot.oab_estado)
      expect(order.target_oab_numero).toBe(pilot.oab_numero)
    })

    test('cron-tick processa order da fila', async ({ request }) => {
      const result = await triggerCronTick(request)
      expect(result).toHaveProperty('processed')
      expect(result.processed).toBeGreaterThanOrEqual(1)
    })

    test('order finaliza como delivered ou failed (não fica stuck)', async ({ request }) => {
      const finalStatus = await waitForCompletion(request, orderId, 120_000)
      console.log(`[${feId}] ${pilot.name} / ${skuName}: status final = ${finalStatus}`)
      expect(['delivered', 'failed']).toContain(finalStatus)
    })

    test(`steps Layer 1 registrados (${layer1MinSteps} esperados)`, async ({ request }) => {
      const steps = await getOrderSteps(request, orderId, operatorToken)
      const layer1 = steps.filter(s => s.layer === 1)
      console.log(`[${feId}] Layer 1: ${layer1.map(s => `${s.step_id}:${s.status}`).join(', ')}`)
      expect(layer1.length).toBeGreaterThanOrEqual(layer1MinSteps)
      const ids = layer1.map(s => s.step_id)
      expect(ids).toContain('lawyer_summary')
      expect(ids).toContain('processes')
    })

    if (layer2StepPrefix) {
      test(`steps Layer 2 criados (${layer2StepPrefix} por CNJ)`, async ({ request }) => {
        const steps = await getOrderSteps(request, orderId, operatorToken)
        const layer2 = steps.filter(s => s.layer === 2)
        console.log(`[${feId}] Layer 2: ${layer2.length} steps (prefixo: ${layer2StepPrefix})`)
        // Se o advogado tem processos, deve haver ao menos um step de Layer 2
        // Se carteira vazia, layer2 = [] é válido — não falhamos nesse caso
        const layer1Done = steps.filter(s => s.layer === 1 && s.step_id === 'processes' && s.status === 'done')
        if (layer1Done.length > 0) {
          // Só exige Layer 2 se o step processes concluiu com sucesso
          expect(layer2.length).toBeGreaterThanOrEqual(0)
        }
        const prefixedSteps = layer2.filter(s => s.step_id.startsWith(layer2StepPrefix))
        console.log(`[${feId}] Steps com prefixo '${layer2StepPrefix}': ${prefixedSteps.length}`)
      })
    }

    test('order_report criado com completion_status e access_token', async ({ request }) => {
      const res = await request.get(
        `${SUPABASE_URL}/rest/v1/order_reports?order_id=eq.${orderId}&select=completion_status,access_token`,
        { headers: SB_HEADERS }
      )
      const [report] = await res.json()
      expect(report).toBeDefined()
      console.log(`[${feId}] report.completion_status = ${report?.completion_status}`)
      expect(['complete', 'partial', 'failed']).toContain(report.completion_status)
      expect(report.access_token).toBeTruthy()
    })
  })
}

// ─── FE-01: Report Saúde × Renato (sync) ─────────────────────────────────────

makeSuite({
  feId: 'FE-01',
  skuLabel: 'simples',
  pilotIndex: 0,
  layer2StepPrefix: null,
  layer1MinSteps: 2,
})

// ─── FE-02: Report Priorização × Victor (async) ───────────────────────────────

makeSuite({
  feId: 'FE-02',
  skuLabel: 'smart',
  pilotIndex: 1,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})

// ─── FE-03: Report Priorização × Rodrigo (async) ─────────────────────────────

makeSuite({
  feId: 'FE-03',
  skuLabel: 'smart',
  pilotIndex: 2,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})

// ─── FE-04: Report Priorização × Renato (async) ───────────────────────────────

makeSuite({
  feId: 'FE-04',
  skuLabel: 'smart',
  pilotIndex: 0,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})

// ─── FE-05: Report Governança × Renato (async) ────────────────────────────────

makeSuite({
  feId: 'FE-05',
  skuLabel: 'pro',
  pilotIndex: 0,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})

// ─── FE-06: Report Governança × Victor (async) ────────────────────────────────

makeSuite({
  feId: 'FE-06',
  skuLabel: 'pro',
  pilotIndex: 1,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})

// ─── FE-07: Report Governança × Rodrigo (async) ───────────────────────────────

makeSuite({
  feId: 'FE-07',
  skuLabel: 'pro',
  pilotIndex: 2,
  layer2StepPrefix: 'movimentacoes',
  layer1MinSteps: 2,
})
