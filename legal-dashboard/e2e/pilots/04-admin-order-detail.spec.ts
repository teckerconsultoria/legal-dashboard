/**
 * Suite: Admin — Detalhe de Pedido & Atribuição
 *
 * Verifica o painel de detalhe de pedido do operador:
 *   - /admin/orders/[id] carrega sem erro
 *   - Steps aparecem na UI (Layer 1 cards, Layer 2 tabela)
 *   - Botão "Atribuir a mim" funciona
 */

import { test, expect } from '@playwright/test'
import { OPERATOR, PILOTS, SKU_NAMES } from './helpers/pilots'
import { getSkuId, createPaidOrder, triggerCronTick, cleanupPilotOrders } from './helpers/api'

test.setTimeout(90_000)

const SUPABASE_URL = 'https://ytyznzelkdorlctzysve.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2NjU2NywiZXhwIjoyMDkxMjQyNTY3fQ.QvUE5dZOxDDo3cUlHS4Na7HQ4QvSF-oEV4RJ2nSCRVY'

/** Faz login e navega para uma URL após o redirect */
async function loginAndGoto(page: import('@playwright/test').Page, targetUrl: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 8000 })
  await page.fill('input[type="email"]', OPERATOR.email)
  await page.fill('input[type="password"]', OPERATOR.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/dashboard|admin/, { timeout: 12000 })
  await page.goto(targetUrl)
}

test.describe('OT — Admin: detalhe de pedido com steps reais', () => {
  const pilot = PILOTS[0] // Renato Lacerda — Report Saúde (sync, mais rápido)
  let orderId: string

  test.beforeAll(async ({ request }) => {
    test.setTimeout(90_000)
    const skuId = await getSkuId(request, SKU_NAMES.simples)
    orderId = await createPaidOrder(request, skuId, pilot)
    // Report Saúde é sync — processOrderSync é chamado diretamente
    // Mas como criamos com status 'paid' sem passar pelo webhook,
    // precisamos enfileirar e acionar o cron
    await request.post(`${SUPABASE_URL}/rest/v1/fulfillment_queue`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: { order_id: orderId, status: 'pending' },
    })
    await triggerCronTick(request)
    // Aguarda processamento (Report Saúde ~10-20s)
    await new Promise(r => setTimeout(r, 25_000))
  })

  test.afterAll(async ({ request }) => {
    await cleanupPilotOrders(request, pilot.email)
  })

  test('OT-06 · Página de detalhe exibe ID do pedido no header', async ({ page }) => {
    await loginAndGoto(page, `/admin/orders/${orderId}`)
    await page.waitForTimeout(3000)

    const shortId = orderId.slice(-8).toUpperCase()
    await expect(page.getByText(shortId)).toBeVisible({ timeout: 8000 })
  })

  test('OT-07 · Steps Layer 1 aparecem como cards (lawyer_summary + processes)', async ({ page }) => {
    await loginAndGoto(page, `/admin/orders/${orderId}`)
    await page.waitForTimeout(3000)

    await expect(page.getByText('Layer 1')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('lawyer_summary')).toBeVisible()
    await expect(page.getByText('processes')).toBeVisible()
  })

  test('OT-08 · Botão "Atribuir a mim" atualiza assigned_operator_id', async ({ page, request }) => {
    await loginAndGoto(page, `/admin/orders/${orderId}`)

    // Aguarda a UI carregar completamente (auth cookie propagado + dados carregados)
    await expect(page.getByText('Layer 1')).toBeVisible({ timeout: 15000 })

    const assignBtn = page.getByRole('button', { name: 'Atribuir a mim' })
    await expect(assignBtn).toBeVisible({ timeout: 8000 })
    await assignBtn.click()

    // Aguarda feedback visual ou conclusão da mutation (até 8s)
    await page.waitForTimeout(3000)

    // Verifica no Supabase
    const res = await request.get(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=assigned_operator_id`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    )
    const [order] = await res.json()
    expect(order.assigned_operator_id).toBeTruthy()
  })
})
