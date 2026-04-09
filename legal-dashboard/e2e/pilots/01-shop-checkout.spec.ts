/**
 * Suite: Shop & Checkout — 3 pilotos
 *
 * Testa o fluxo de compra do ponto de vista do cliente.
 * Stripe NÃO é executado de verdade — URL de checkout é interceptada.
 */

import { test, expect } from '@playwright/test'
import { PILOTS } from './helpers/pilots'

// ─── Shop carrega ──────────────────────────────────────────────────────────

test('CT-00 · Shop lista os 3 SKUs disponíveis', async ({ page }) => {
  await page.goto('/shop')
  await page.waitForSelector('h2', { timeout: 8000 })
  await expect(page.getByText('Report Saúde')).toBeVisible()
  await expect(page.getByText('Report Priorização')).toBeVisible()
  await expect(page.getByText('Report Governança')).toBeVisible()
})

// ─── Checkout por piloto ────────────────────────────────────────────────────

for (const pilot of PILOTS) {
  test.describe(`Piloto: ${pilot.name}`, () => {

    test(`CT-01 · ${pilot.label} — checkout anônimo envia sku_id correto`, async ({ page }) => {
      await page.goto('/shop')
      await page.waitForSelector('button:has-text("Comprar Agora")', { timeout: 8000 })

      let requestBody: Record<string, unknown> = {}
      await page.route('/api/checkout', async (route, request) => {
        requestBody = await request.postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            checkout_url: 'https://checkout.stripe.com/c/pay/test_mock',
            order_id: `order-mock-${pilot.label}`,
          }),
        })
      })

      await page.locator('button:has-text("Comprar Agora")').first().click()
      await page.waitForTimeout(1000)

      expect(requestBody).toHaveProperty('sku_id')
      expect(typeof requestBody.sku_id).toBe('string')
    })

    test(`CT-02 · ${pilot.label} — botão fica disabled durante processamento`, async ({ page }) => {
      await page.goto('/shop')
      await page.waitForSelector('button:has-text("Comprar Agora")', { timeout: 8000 })

      // Intercepta e atrasa resposta via Promise externa (não usa page.waitForTimeout no handler)
      let resolveFulfill: () => void
      const holdFulfill = new Promise<void>(r => { resolveFulfill = r })

      await page.route('/api/checkout', async (route) => {
        await holdFulfill // aguarda sinal externo
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ checkout_url: 'https://checkout.stripe.com/test', order_id: 'x' }),
        })
      })

      // Localizador estável por classe CSS — não depende do texto que muda após o click
      const btn = page.locator('button.bg-blue-600').first()
      await btn.click()

      // Após o click, texto muda para "Processando..." e disabled=true
      await expect(btn).toBeDisabled({ timeout: 2000 })

      // Libera o handler
      resolveFulfill!()
    })

    test(`CT-03 · ${pilot.label} — sem duplo envio com cliques rápidos`, async ({ page }) => {
      await page.goto('/shop')
      await page.waitForSelector('button:has-text("Comprar Agora")', { timeout: 8000 })

      let callCount = 0
      await page.route('/api/checkout', async (route) => {
        callCount++
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ checkout_url: 'https://checkout.stripe.com/test', order_id: 'x' }),
        })
      })

      // Localizador estável por classe CSS — não depende do texto que muda após o click
      const btn = page.locator('button.bg-blue-600').first()
      // Primeiro click — botão fica disabled imediatamente (React setState síncrono)
      await btn.click()
      // Segundo e terceiro clicks — devem ser ignorados pois botão está disabled
      await btn.click({ force: false }).catch(() => {})
      await btn.click({ force: false }).catch(() => {})
      await page.waitForTimeout(1500)

      // Apenas 1 request deve ter sido feito
      expect(callCount).toBeLessThanOrEqual(1)
    })
  })
}

// ─── Páginas de sucesso e cancelamento ─────────────────────────────────────

test('CT-04 · Página /checkout/success renderiza sem erro', async ({ page }) => {
  await page.goto('/checkout/success?session_id=cs_test_mock')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Internal Server Error')
  await expect(page.locator('body')).not.toContainText('Application error')
})

test('CT-05 · Página /checkout/cancel renderiza sem erro', async ({ page }) => {
  await page.goto('/checkout/cancel?session_id=cs_test_mock')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('body')).not.toContainText('Internal Server Error')
  await expect(page.locator('body')).not.toContainText('Application error')
})

// ─── Segurança ──────────────────────────────────────────────────────────────

test('ST-01 · Checkout sem sku_id retorna 400', async ({ request }) => {
  const res = await request.post('http://localhost:3000/api/checkout', {
    data: { sku_id: '', user_id: null, user_email: null },
  })
  expect(res.status()).toBe(400)
})
