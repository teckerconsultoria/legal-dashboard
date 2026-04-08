import { test, expect } from '@playwright/test';

test.describe('Shop - Fluxo de Compra', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.goto('/shop');
  });

  test('deve carregar catálogo de produtos', async ({ page }) => {
    const content = await page.content();
    console.log('PAGE CONTENT:', content.substring(0, 500));
    
    await expect(page.locator('h1')).toContainText('Nossos Serviços');
    await page.waitForTimeout(2000);
  });
});
