/**
 * Suite: Ops Dashboard — Fluxo do Operador
 *
 * Login real via Supabase → /dashboard/reports → navega para /admin.
 * Login page redireciona para /dashboard/reports após auth bem-sucedido.
 */

import { test, expect } from '@playwright/test'
import { OPERATOR, CRON_SECRET } from './helpers/pilots'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjY1NjcsImV4cCI6MjA5MTI0MjU2N30.ayeuOo4IKm06fhRVoj0Y59taAaJkuTFG6BcMhdwELVo'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2NjU2NywiZXhwIjoyMDkxMjQyNTY3fQ.QvUE5dZOxDDo3cUlHS4Na7HQ4QvSF-oEV4RJ2nSCRVY'
const SUPABASE_URL = 'https://ytyznzelkdorlctzysve.supabase.co'

// ─── Proteção de rotas (sem browser) ───────────────────────────────────────

test('ST-02 · GET /api/admin/orders sem sessão → 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/admin/orders')
  expect(res.status()).toBe(401)
})

test('ST-03 · GET /api/admin/orders/[id]/steps sem sessão → 401', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/admin/orders/00000000-0000-0000-0000-000000000000/steps')
  expect(res.status()).toBe(401)
})

test('ST-04 · Cron-tick sem secret → 401', async ({ request }) => {
  const res = await request.post('http://localhost:3000/api/internal/cron-tick')
  expect(res.status()).toBe(401)
})

test('ST-05 · Cron-tick com secret errado → 401', async ({ request }) => {
  const res = await request.post('http://localhost:3000/api/internal/cron-tick', {
    headers: { 'x-cron-secret': 'senha-errada' },
  })
  expect(res.status()).toBe(401)
})

// ─── API com token do operador ──────────────────────────────────────────────

test('OT-03 · API /api/admin/orders retorna 200 com token de operador', async ({ request }) => {
  const loginRes = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: OPERATOR.email, password: OPERATOR.password },
    }
  )
  const auth = await loginRes.json()
  expect(auth.access_token, 'Login do operador deve retornar token').toBeTruthy()

  const apiRes = await request.get('http://localhost:3000/api/admin/orders', {
    headers: { Authorization: `Bearer ${auth.access_token}` },
  })
  expect(apiRes.status()).toBe(200)
  const data = await apiRes.json()
  expect(Array.isArray(data.orders)).toBe(true)
})

test('OT-04 · Cron-tick com secret correto retorna 200', async ({ request }) => {
  const res = await request.post('http://localhost:3000/api/internal/cron-tick', {
    headers: { 'x-cron-secret': CRON_SECRET },
  })
  expect(res.status()).toBe(200)
  const data = await res.json()
  expect(data).toHaveProperty('processed')
  expect(data).toHaveProperty('stuck_marked_dead')
})

// ─── Fluxo browser do operador ──────────────────────────────────────────────

test('OT-01 · /admin sem login exibe mensagem de acesso restrito', async ({ page }) => {
  // Contexto fresh (sem cookies)
  await page.goto('/admin')
  // Aguarda hydration do client component
  await page.waitForTimeout(2000)

  // A página deve mostrar "Acesso restrito" OU "Fazer login" OU redirecionar para /login
  const url = page.url()
  const bodyText = await page.locator('body').innerText()

  const isLoginPage = url.includes('/login')
  const hasAccessRestricted = bodyText.toLowerCase().includes('acesso restrito') ||
                               bodyText.toLowerCase().includes('fazer login')
  const hasNoTable = !(await page.locator('table').isVisible())

  expect(isLoginPage || hasAccessRestricted || hasNoTable).toBeTruthy()
})

test('OT-02 · Operador faz login e é redirecionado', async ({ page }) => {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 8000 })

  await page.fill('input[type="email"]', OPERATOR.email)
  await page.fill('input[type="password"]', OPERATOR.password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Login page redireciona para /dashboard/reports
  await page.waitForURL(/dashboard|admin/, { timeout: 12000 })
  expect(page.url()).toContain('localhost:3000')
})

test('OT-05 · Após login, /admin exibe tabela de pedidos', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 8000 })
  await page.fill('input[type="email"]', OPERATOR.email)
  await page.fill('input[type="password"]', OPERATOR.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/dashboard|admin/, { timeout: 12000 })

  // Navega para admin
  await page.goto('/admin')
  await expect(page.getByText('Ops Dashboard')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('table')).toBeVisible({ timeout: 8000 })
})
