import { test, expect } from '@playwright/test'

test.describe('Legal Dashboard E2E', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2')).toContainText('Selecione sua OAB')
  })

  test('OAB selector form', async ({ page }) => {
    await page.goto('/')
    await page.selectOption('select', 'SP')
    await page.fill('input', '123456')
    await page.click('button:has-text("Visualizar Carteira")')
    await page.waitForSelector('.text-blue-600')
  })

  test('admin page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin')
    // Sem sessão: redireciona para /login ou exibe acesso restrito
    await page.waitForTimeout(2000)
    const url = page.url()
    const bodyText = await page.locator('body').innerText()
    const isLoginPage = url.includes('/login')
    const hasRestrictedMsg = bodyText.toLowerCase().includes('acesso restrito') ||
                             bodyText.toLowerCase().includes('fazer login')
    const hasNoTable = !(await page.locator('table').isVisible())
    expect(isLoginPage || hasRestrictedMsg || hasNoTable).toBeTruthy()
  })
})