import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Catálogo de Produtos (/shop)
 * 
 * Cobertura:
 * - Carregamento da página
 * - Exibição de SKUs ativos
 * - Preços e destaques
 * - Estados de loading e vazio
 */

test.describe('Shop - Catálogo de Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
  });

  test('deve carregar página /shop corretamente', async ({ page }) => {
    // Verifica título e estrutura básica
    await expect(page.locator('h1')).toContainText('Nossos Serviços');
    await expect(page.locator('main')).toBeVisible();
    
    // Verifica header
    await expect(page.locator('header')).toBeVisible();
  });

  test('deve exibir catálogo de SKUs da API', async ({ page }) => {
    // Aguarda carregamento dos produtos
    await page.waitForSelector('.grid > div', { timeout: 5000 });
    
    // Verifica que existem cards de produtos
    const productCards = page.locator('.grid > div');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir preços formatados corretamente (BRL)', async ({ page }) => {
    // Aguarda carregamento
    await page.waitForSelector('text=R$', { timeout: 5000 });
    
    // Verifica formato de moeda brasileira
    const priceElements = page.locator('text=/R\\$\\s*[\\d.]+,[\\d]{2}/');
    const count = await priceElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir highlights dos produtos', async ({ page }) => {
    // Verifica elementos de destaque
    await expect(page.getByText(/entrega em/i).first()).toBeVisible();
    
    // Verifica ícones de check
    const checkIcons = page.locator('svg[class*="text-green"]');
    const count = await checkIcons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve mostrar botão "Comprar Agora" em cada produto', async ({ page }) => {
    // Aguarda carregamento
    await page.waitForSelector('button:has-text("Comprar Agora")', { timeout: 5000 });
    
    const buyButtons = page.locator('button:has-text("Comprar Agora")');
    const count = await buyButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve mostrar estado de loading inicialmente', async ({ page }) => {
    // Recarrega para ver estado inicial
    await page.goto('/shop');
    
    // Verifica que o loading aparece (spinner ou texto)
    const loadingIndicator = page.locator('text=/carregando/i, .animate-spin');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('deve mostrar mensagem quando catálogo está vazio', async ({ page }) => {
    // Simula resposta vazia interceptando API
    await page.route('/api/skus', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ skus: [] }),
      });
    });
    
    await page.goto('/shop');
    
    // Verifica mensagem de vazio
    await expect(page.locator('text=/nenhum serviço disponível/i')).toBeVisible();
  });

  test('deve lidar com erro da API de SKUs', async ({ page }) => {
    // Simula erro na API
    await page.route('/api/skus', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.goto('/shop');
    
    // Verifica que a página não quebra (mostra estado vazio)
    await expect(page.locator('text=/nenhum serviço disponível/i')).toBeVisible();
  });

  test('deve ter navegação funcional', async ({ page }) => {
    // Verifica link para home
    const homeLink = page.locator('a[href="/"]');
    if (await homeLink.count() > 0) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Shop - Responsividade', () => {
  test('deve adaptar layout em mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/shop');
    
    // Verifica que produtos são visíveis
    await page.waitForSelector('.grid > div', { timeout: 5000 });
    const productCards = page.locator('.grid > div');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('deve adaptar layout em tablet', async ({ page }) => {
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/shop');
    
    await page.waitForSelector('.grid > div', { timeout: 5000 });
    const productCards = page.locator('.grid > div');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('deve adaptar layout em desktop', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/shop');
    
    await page.waitForSelector('.grid > div', { timeout: 5000 });
    const productCards = page.locator('.grid > div');
    expect(await productCards.count()).toBeGreaterThan(0);
  });
});
