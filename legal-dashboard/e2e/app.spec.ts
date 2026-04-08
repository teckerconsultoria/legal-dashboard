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

  test('admin page loads', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('h1')).toContainText('Admin')
  })
})